/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.app.engine.image;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

import modelengine.fel.core.image.ImageModel;
import modelengine.fit.jober.aipp.dto.chat.FileUploadInfo;
import modelengine.fit.jober.aipp.genericable.adapter.FileServiceAdapter;
import modelengine.fit.jober.entity.FileDeclaration;
import modelengine.fitframework.resource.web.Media;
import modelengine.jade.app.engine.image.entity.GenerateImageParam;
import modelengine.jade.app.engine.image.service.impl.ImageGeneratorImpl;
import modelengine.jade.common.exception.ModelEngineException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 表示 {@link ImageGeneratorImpl} 的测试集。
 *
 * @author 何嘉斌
 * @since 2024-12-18
 */
@DisplayName("测试 ImageGenerator 的实现")
@ExtendWith(MockitoExtension.class)
public class ImageGeneratorImplTest {
    private static final String IMAGE_CONTENT_BASE64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBg";

    private ImageGeneratorImpl imageGenerator;

    @Mock
    private ImageModel imageModel;

    @Mock
    private FileServiceAdapter fileService;

    @BeforeEach
    void setUp() {
        this.imageGenerator = new ImageGeneratorImpl("", "", "", "", "", this.imageModel, this.fileService);
    }

    @Test
    @DisplayName("生成一张图片成功")
    void shouldOkWhenGenerateOneImage() {
        Media image = new Media("image/jpeg", IMAGE_CONTENT_BASE64);
        when(this.imageModel.generate(anyString(), any())).thenReturn(Collections.singletonList(image));
        FileUploadInfo fileUploadInfo = new FileUploadInfo();
        doAnswer(invocation -> {
            FileDeclaration fileDeclaration = invocation.getArgument(3);
            assertThat(fileDeclaration.getContent()).isEqualTo(Base64.getDecoder()
                    .decode(IMAGE_CONTENT_BASE64.getBytes()));
            return fileUploadInfo;
        }).when(this.fileService).upload(any(), any(), any(), any());
        String imageUrl = "http://localhost/a";
        when(this.fileService.getUrl(any(), ArgumentMatchers.eq(fileUploadInfo))).thenReturn(imageUrl);
        GenerateImageParam imageParam = new GenerateImageParam();
        imageParam.setArgs(new HashMap<>());
        imageParam.setDescriptionTemplate("desc");
        imageParam.setImageCount(1);

        List<Media> images = this.imageGenerator.generateImage(imageParam);

        assertThat(images.size()).isEqualTo(1);
        assertThat(images.get(0).getData()).isEqualTo(imageUrl);
        assertThat(images.get(0).getMime()).isEqualTo(image.getMime());
    }

    @Test
    @DisplayName("生成多张图片成功")
    void shouldOkWhenGenerateMultipleImages() {
        List<Media> images = Collections.singletonList(new Media("image/jpeg", IMAGE_CONTENT_BASE64));
        when(this.imageModel.generate(anyString(), any())).thenReturn(images, images, images);
        GenerateImageParam imageParam = new GenerateImageParam();
        imageParam.setArgs(new HashMap<>());
        imageParam.setDescriptionTemplate("desc");
        imageParam.setImageCount(3);
        FileUploadInfo fileUploadInfo = new FileUploadInfo();
        doAnswer(invocation -> {
            FileDeclaration fileDeclaration = invocation.getArgument(3);
            assertThat(fileDeclaration.getContent()).isEqualTo(Base64.getDecoder()
                    .decode(IMAGE_CONTENT_BASE64.getBytes()));
            return fileUploadInfo;
        }).when(this.fileService).upload(any(), any(), any(), any());
        List<String> imageUrls = Arrays.asList("http://localhost/a", "http://localhost/b", "http://localhost/c");
        when(this.fileService.getUrl(any(), ArgumentMatchers.eq(fileUploadInfo))).thenReturn(imageUrls.get(0),
                imageUrls.get(1),
                imageUrls.get(2));

        images = this.imageGenerator.generateImage(imageParam);
        assertThat(images.size()).isEqualTo(3);
        assertThat(images.stream().map(Media::getData).collect(Collectors.toList())).containsOnly(imageUrls.get(0),
                imageUrls.get(1),
                imageUrls.get(2));
    }

    @Test
    @DisplayName("缺失必填字段时，调用失败")
    void shouldFailWhenGenerateImageWithoutRequiredField() {
        Media image = new Media("image/jpeg", "fake image data");
        GenerateImageParam imageParam = new GenerateImageParam();
        assertThatThrownBy(() -> this.imageGenerator.generateImage(imageParam)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("生成 url 不符合规范时，调用失败")
    void shouldFailWhenGenerateImageWithInvalidFileUrl() {
        Media image = new Media("image/jpeg", IMAGE_CONTENT_BASE64);
        when(this.imageModel.generate(anyString(), any())).thenReturn(Collections.singletonList(image));
        FileUploadInfo fileUploadInfo = new FileUploadInfo();
        doAnswer(invocation -> {
            FileDeclaration fileDeclaration = invocation.getArgument(3);
            assertThat(fileDeclaration.getContent()).isEqualTo(Base64.getDecoder()
                    .decode(IMAGE_CONTENT_BASE64.getBytes()));
            return fileUploadInfo;
        }).when(this.fileService).upload(any(), any(), any(), any());
        String imageUrl = "xxx";
        when(this.fileService.getUrl(any(), ArgumentMatchers.eq(fileUploadInfo))).thenReturn(imageUrl);
        GenerateImageParam imageParam = new GenerateImageParam();
        imageParam.setArgs(new HashMap<>());
        imageParam.setDescriptionTemplate("desc");
        imageParam.setImageCount(1);

        assertThatThrownBy(() -> this.imageGenerator.generateImage(imageParam)).isInstanceOf(ModelEngineException.class)
                .extracting("message")
                .asString()
                .startsWith("Malformed URL has occurred");
    }

    @Test
    @DisplayName("生成一张 URL 图片成功")
    void shouldOkWhenGenerateOneImageWithUrl() {
        String imageUrl = "http://localhost/a";
        Media image = new Media("image/jpeg", imageUrl);
        when(this.imageModel.generate(anyString(), any())).thenReturn(Collections.singletonList(image));
        GenerateImageParam imageParam = new GenerateImageParam();
        imageParam.setArgs(new HashMap<>());
        imageParam.setDescriptionTemplate("desc");
        imageParam.setImageCount(1);

        List<Media> images = this.imageGenerator.generateImage(imageParam);

        assertThat(images.size()).isEqualTo(1);
        assertThat(images.get(0).getData()).isEqualTo(imageUrl);
        assertThat(images.get(0).getMime()).isEqualTo(image.getMime());
    }
}