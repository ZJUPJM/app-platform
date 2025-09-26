/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.app.engine.image.service.impl;

import static modelengine.fitframework.inspection.Validation.notNull;

import modelengine.fel.core.image.ImageModel;
import modelengine.fel.core.image.ImageOption;
import modelengine.fit.jane.common.entity.OperationContext;
import modelengine.fit.jober.aipp.dto.chat.FileUploadInfo;
import modelengine.fit.jober.aipp.genericable.adapter.FileServiceAdapter;
import modelengine.fit.jober.entity.FileDeclaration;
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.annotation.Fitable;
import modelengine.fitframework.annotation.Value;
import modelengine.fitframework.resource.web.Media;
import modelengine.fitframework.util.StringUtils;
import modelengine.jade.app.engine.image.code.ImageGenerationRetCode;
import modelengine.jade.app.engine.image.entity.GenerateImageParam;
import modelengine.jade.app.engine.image.service.ImageGenerator;
import modelengine.jade.common.exception.ModelEngineException;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * 表示 {@link ImageGenerator} 的 fit 实现。
 *
 * @author 何嘉斌
 * @since 2024-12-17
 */
@Component
public class ImageGeneratorImpl implements ImageGenerator {
    private static final String IMAGE_SIZE = "256x256";
    private static final int MAX_IMAGE_COUNT = 5;

    private final String baselUrl;
    private final String imageGenModel;
    private final String apiKey;
    private final ImageModel imageModel;
    private final FileServiceAdapter fileService;
    private final String imageSize;
    private final String defaultImageMimeType;

    /**
     * 图片生成器实现的构造方法。
     *
     * @param baselUrl 表示图片生成服务地址的 {@link String}。
     * @param imageGenModel 表示图片模型名称的 {@link String}。
     * @param apiKey 表示模型认证信息的 {@link String}。
     * @param imageSize 表示生成图片规格的 {@link String}。
     * @param imageModel 表示图片模型服务的 {@link ImageModel}。
     * @param fileService 表示文件服务的 {@link FileServiceAdapter}。
     */
    public ImageGeneratorImpl(@Value("${model.imageGen.url}") String baselUrl,
            @Value("${model.imageGen.model}") String imageGenModel, @Value("${model.imageGen.apiKey}") String apiKey,
            @Value("${model.imageGen.imageSize}") String imageSize,
            @Value("${model.imageGen.defaultImageMimeType}") String defaultImageMimeType, ImageModel imageModel,
            FileServiceAdapter fileService) {
        this.baselUrl = baselUrl;
        this.imageGenModel = imageGenModel;
        this.apiKey = apiKey;
        this.imageModel = imageModel;
        this.fileService = fileService;
        this.imageSize = imageSize;
        this.defaultImageMimeType = defaultImageMimeType;
    }

    @Override
    @Fitable("default")
    public List<Media> generateImage(GenerateImageParam imageParam) {
        notNull(imageParam, "The image generation param cannot be null.");
        String prompt = imageParam.getDesc();
        ImageOption option = ImageOption.custom()
                .baseUrl(this.baselUrl)
                .model(this.imageGenModel)
                .apiKey(this.apiKey)
                .size(this.imageSize)
                .build();
        int imageCount = Math.min(notNull(imageParam.getImageCount(), "The image count cannot be null."),
                MAX_IMAGE_COUNT);
        return IntStream.range(0, imageCount)
                .parallel()
                .mapToObj(i -> this.imageModel.generate(prompt, option))
                .flatMap(List::stream)
                .map(this::getImageUrl)
                .collect(Collectors.toList());
    }

    private Media getImageUrl(Media entity) {
        String url;
        String mimeType;
        if (entity.getData().startsWith("http")) {
            url = entity.getData();
            mimeType = StringUtils.blankIf(entity.getMime(), this.defaultImageMimeType);
        } else {
            byte[] imageContent = Base64.getDecoder().decode(entity.getData().getBytes());
            FileDeclaration fileDeclaration = new FileDeclaration(this.generateFileName(), imageContent);
            OperationContext operationContext = new OperationContext();
            FileUploadInfo uploadInfo = this.fileService.upload(operationContext,
                    "31f20efc7e0848deab6a6bc10fc3021e",
                    "textToImage",
                    fileDeclaration);
            url = this.fileService.getUrl(operationContext, uploadInfo);
            mimeType = entity.getMime();
        }
        try {
            return new Media(mimeType, new URL(url).toString());
        } catch (MalformedURLException ex) {
            throw new ModelEngineException(ImageGenerationRetCode.MALFORMED_URL, ex, url);
        }
    }

    private String generateFileName() {
        return UUID.randomUUID().toString().replace("-", "") + ".jpeg";
    }
}