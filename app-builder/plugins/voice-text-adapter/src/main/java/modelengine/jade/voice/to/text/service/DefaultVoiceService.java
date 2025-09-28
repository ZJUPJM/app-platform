/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.voice.to.text.service;

import com.alibaba.fastjson.JSONException;
import com.alibaba.fastjson.JSONObject;

import modelengine.fit.jane.common.entity.OperationContext;
import modelengine.fit.jober.aipp.common.exception.AippErrCode;
import modelengine.fit.jober.aipp.common.exception.AippException;
import modelengine.fit.jober.aipp.genericable.adapter.FileServiceAdapter;
import modelengine.fitframework.annotation.Value;
import modelengine.fitframework.inspection.Validation;
import modelengine.fitframework.log.Logger;
import modelengine.fitframework.util.StringUtils;
import modelengine.jade.voice.service.VoiceService;

import modelengine.fel.service.pipeline.HuggingFacePipelineService;
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.annotation.Fitable;
import okhttp3.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 语音的 Http 请求的服务层实现。
 *
 * @author 张粟
 * @since 2024-06-18
 */
@Component
public class DefaultVoiceService implements VoiceService {
    private static final Logger LOG = Logger.get(DefaultVoiceService.class);
    // 定义自定义词汇表
    private static final Map<String, String> CUSTOM_WORDS = new HashMap<>();
    private static final int VOICE_JSON_BEGIN_INDEX = 1;

    private final HuggingFacePipelineService pipelineService;
    private final OkHttpClient client;
    private final String modelBaseUrl;
    private final String model;
    private final String apiKey;
    private final FileServiceAdapter fileService;

    public DefaultVoiceService(HuggingFacePipelineService pipelineService,
            @Value("${model.audioTranscriptions.url}") String modelBaseUrl,
            @Value("${model.audioTranscriptions.model}") String model,
            @Value("${model.audioTranscriptions.apiKey}") String apiKey,
            @Value("${model.audioTranscriptions.connectTimeout:5}") long connectTimeout,
            @Value("${model.audioTranscriptions.readTimeout:60}") long readTimeout,
            @Value("${model.audioTranscriptions.writeTimeout:30}") long writeTimeout, FileServiceAdapter fileService) {
        this.pipelineService = pipelineService;
        this.modelBaseUrl = modelBaseUrl;
        this.model = model;
        this.apiKey = apiKey;
        this.fileService = fileService;
        this.client = new OkHttpClient.Builder().connectTimeout(Validation.greaterThan(connectTimeout,
                        0,
                        "The connect timeout should > 0."), TimeUnit.SECONDS)
                .readTimeout(Validation.greaterThan(readTimeout, 0, "The read timeout should > 0."), TimeUnit.SECONDS)
                .writeTimeout(Validation.greaterThan(writeTimeout, 0, "The write timeout should > 0."),
                        TimeUnit.SECONDS)
                .build();
    }

    /**
     * 语音转文字
     *
     * @param filePath 输入语音文件路径 {@link String}。
     * @return 文本 {@link String}。
     */
    @Override
    @Fitable(id = "voice-get-text")
    public String getText(String filePath) {
        try {
            return this.transcribe(filePath, this.model);
        } catch (IOException e) {
            LOG.error("Failed to get voice text. [errorMessage={}]", e.getMessage());
            LOG.error("Exception:", e);
            throw new AippException(AippErrCode.AUDIO_CONTENT_EXTRACT_FAILED);
        }
    }

    /**
     * 后处理函数
     *
     * @param transcription transcription
     * @param customWords customWords
     * @return String
     */
    public String postProcessTranscription(String transcription, Map<String, String> customWords) {
        StringBuilder processedTranscription = new StringBuilder(transcription);
        for (Map.Entry<String, String> entry : customWords.entrySet()) {
            int index;
            while ((index = processedTranscription.indexOf(entry.getKey())) != -1) {
                processedTranscription.replace(index, index + entry.getKey().length(), entry.getValue());
            }
        }
        return processedTranscription.toString();
    }

    /**
     * 文字转语音
     *
     * @param text 输入文本 {@link String}。
     * @param tone 输入音色 {@link int}。
     * @return 语音 {@link String}。
     */
    @Override
    @Fitable(id = "voice-get-voice")
    public String getVoice(String text, int tone) {
        Map<String, Object> postParam = new HashMap<>();
        postParam.put("text_inputs", text);
        String resultJson = this.pipelineService.call("text-to-speech", "2Noise/ChatTTS",
                postParam).toString();
        return resultJson.split(",")[0].split("data")[1].substring(VOICE_JSON_BEGIN_INDEX);
    }

    private String transcribe(String filePath, String modelName) throws IOException {
        Path path = Paths.get(filePath);
        if (!this.fileService.isAllowedPath(filePath, new OperationContext())) {
            throw new AippException(AippErrCode.INVALID_FILE_PATH);
        }
        File file = path.toFile();
        if (!file.exists()) {
            throw new AippException(AippErrCode.FILE_EXPIRED_OR_BROKEN);
        }
        LOG.info("Audio transcriptions. [file={}, size={} bytes, model={}]", filePath, file.length(), modelName);

        RequestBody requestBody = createMultipartBody(file);
        Request request = createRequest(requestBody);
        try (Response response = client.newCall(request).execute()) {
            return handleResponse(response);
        }
    }

    private RequestBody createMultipartBody(File audioFile) {
        String fileName = audioFile.getName().toLowerCase();
        MediaType mediaType;
        if (fileName.endsWith(".wav")) {
            mediaType = MediaType.parse("audio/wav");
        } else if (fileName.endsWith(".mp3")) {
            mediaType = MediaType.parse("audio/mpeg");
        } else if (fileName.endsWith(".m4a")) {
            mediaType = MediaType.parse("audio/mp4");
        } else {
            mediaType = MediaType.parse("audio/*");
        }

        return new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("file", audioFile.getName(),
                        RequestBody.create(audioFile, mediaType))
                .addFormDataPart("model", this.model)
                .build();
    }

    private Request createRequest(RequestBody requestBody) {
        Request.Builder requestBuilder = new Request.Builder().url(this.modelBaseUrl + "/audio/transcriptions")
                .post(requestBody);
        if (StringUtils.isNotBlank(this.apiKey)) {
            requestBuilder.header("Authorization", "Bearer " + this.apiKey);
        }
        return requestBuilder
                .build();
    }

    private String handleResponse(Response response) throws IOException {
        int statusCode = response.code();
        ResponseBody body = response.body();
        if (statusCode == 200) {
            if (body == null) {
                throw new IllegalStateException("The response body is abnormal.");
            }
            try {
                JSONObject bodyObject = JSONObject.parseObject(body.string());
                Object text = bodyObject.get("text");
                if (text == null) {
                    throw new IllegalStateException("The response body does not contain a text filed.");
                }
                return text.toString();
            } catch (JSONException e) {
                throw new IllegalStateException("The response body is not json object.", e);
            }

        }
        String errorMessage = (body == null) ? "null body" : body.string();
        throw new IOException(statusCode + " - " + errorMessage);
    }
}
