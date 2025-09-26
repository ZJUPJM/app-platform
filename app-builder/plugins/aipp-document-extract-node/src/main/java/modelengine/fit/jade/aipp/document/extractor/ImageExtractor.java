/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jade.aipp.document.extractor;

import modelengine.fel.core.chat.ChatMessage;
import modelengine.fel.core.chat.ChatModel;
import modelengine.fel.core.chat.ChatOption;
import modelengine.fel.core.chat.support.ChatMessages;
import modelengine.fel.core.chat.support.HumanMessage;
import modelengine.fit.jade.aipp.document.code.DocumentExtractRetCode;
import modelengine.fit.jade.aipp.document.exception.DocumentExtractException;
import modelengine.fit.jane.common.entity.OperationContext;
import modelengine.fit.jober.aipp.common.exception.AippErrCode;
import modelengine.fit.jober.aipp.common.exception.AippException;
import modelengine.fit.jober.aipp.entity.FileExtensionEnum;
import modelengine.fit.jober.aipp.genericable.adapter.FileServiceAdapter;
import modelengine.fit.jober.aipp.service.OperatorService;
import modelengine.fit.jober.aipp.service.OperatorService.FileType;
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.annotation.Value;
import modelengine.fitframework.log.Logger;
import modelengine.fitframework.resource.web.Media;
import modelengine.fitframework.util.CollectionUtils;
import modelengine.fitframework.util.MapUtils;
import modelengine.fitframework.util.ObjectUtils;
import modelengine.fitframework.util.StringUtils;

import java.io.IOException;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * 图片提取工具。
 *
 * @author 马朝阳
 * @since 2024-12-12
 */
@Component
public class ImageExtractor implements BaseExtractor {
    private static final Logger LOG = Logger.get(ImageExtractor.class);

    private final ChatModel chatModel;
    private final String baseUrl;
    private final String modelName;
    private final String apiKey;
    private final FileServiceAdapter fileService;


    public ImageExtractor(ChatModel chatModel, @Value("${model.imageExtractor.url}") String baselUrl,
            @Value("${model.imageExtractor.model}") String modelName,
            @Value("${model.imageExtractor.apiKey}") String apiKey, FileServiceAdapter fileService) {
        this.chatModel = chatModel;
        this.baseUrl = baselUrl;
        this.modelName = modelName;
        this.apiKey = apiKey;
        this.fileService = fileService;
    }

    /**
     * 表示圖片内容提取接口。
     *
     * @param fileUrl 文件链接。
     * @param context 文件提取额外参数。
     * @return 表示文件内容的 {@link String}。
     */
    @Override
    public String extract(String fileUrl, Map<String, Object> context) {
        LOG.info("Start to extract image. [file={}]", fileUrl);
        if (MapUtils.isEmpty(context) || !context.containsKey("prompt")) {
            LOG.error("There is no key of prompt when extract prompt, fileUrl:{0}", fileUrl);
            throw new DocumentExtractException(DocumentExtractRetCode.EMPTY_EXTRACT_PARAM, "prompt");
        }
        String prompt = ObjectUtils.cast(context.get("prompt"));
        if (StringUtils.isEmpty(prompt)) {
            prompt = "请描述一下图片。";
        }
        FileType fileType = FileExtensionEnum.findType(fileUrl)
                .orElseThrow(() -> new AippException(AippErrCode.INPUT_PARAM_IS_INVALID, "fileType"));
        if (!OperatorService.FileType.IMAGE.equals(fileType)) {
            throw new AippException(AippErrCode.INPUT_PARAM_IS_INVALID, "fileType");
        }
        String base64Content;
        try {
            base64Content =
                    Base64.getEncoder().encodeToString(this.fileService.readFile(new OperationContext(), fileUrl));
        } catch (IOException e) {
            LOG.error("Failed to read file.", e);
            throw new AippException(AippErrCode.EXTRACT_FILE_FAILED);
        }
        String mimeType = "image/" + FileExtensionEnum.getFileExtension(fileUrl);
        ChatMessages chatMessages = ChatMessages.from(Arrays.asList(new HumanMessage(prompt),
                new HumanMessage(StringUtils.EMPTY, Collections.singletonList(new Media(mimeType, base64Content)))));
        ChatOption option = ChatOption.custom()
                .baseUrl(this.baseUrl)
                .model(this.modelName)
                .apiKey(this.apiKey)
                .stream(false)
                .build();
        List<ChatMessage> messages = chatModel.generate(chatMessages, option).blockAll();
        if (CollectionUtils.isEmpty(messages)) {
            LOG.error("Chat model response is empty.");
            return StringUtils.EMPTY;
        }
        String ans = messages.get(0).text();
        LOG.debug("question={} ans={}", ObjectUtils.<String>cast(chatMessages.messages().get(0).text()), ans);
        return ans;
    }

    @Override
    public FileType type() {
        return FileType.IMAGE;
    }
}
