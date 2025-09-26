/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jober.aipp.northbound;

import modelengine.fit.http.entity.FileEntity;
import modelengine.fit.http.entity.PartitionedEntity;
import modelengine.fit.jane.common.entity.OperationContext;
import modelengine.fit.jober.aipp.common.exception.AippErrCode;
import modelengine.fit.jober.aipp.common.exception.AippException;
import modelengine.fit.jober.aipp.domains.appversion.AppVersion;
import modelengine.fit.jober.aipp.domains.appversion.service.AppVersionService;
import modelengine.fit.jober.aipp.dto.chat.FileUploadInfo;
import modelengine.fit.jober.aipp.genericable.adapter.FileServiceAdapter;
import modelengine.fit.jober.aipp.service.FileService;
import modelengine.fit.jober.aipp.util.AippFileUtils;
import modelengine.fit.jober.entity.FileDeclaration;
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.annotation.Value;
import modelengine.fitframework.beans.BeanUtils;
import modelengine.fitframework.util.MapBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * {@link FileService} 的适配器类的实现类。
 *
 * @author 曹嘉美
 * @since 2024-12-20
 */
@Component
public class FileServiceAdapterImpl implements FileServiceAdapter {
    private final FileService fileService;
    private final AppVersionService appVersionService;
    private final String fileAccessBaseUrl;

    /**
     * 文件适配服务实现的构造方法。
     *
     * @param fileService 表示文件服务的 {@link FileService}。
     * @param appVersionService 表示应用版本服务的 {@link AppVersionService}。
     * @param fileAccessBaseUrl 表示文件访问基础地址的 {@link String}。
     */
    public FileServiceAdapterImpl(FileService fileService, AppVersionService appVersionService,
            @Value("${app-engine.file.nas.accessBaseUrl}") String fileAccessBaseUrl) {
        this.fileService = fileService;
        this.appVersionService = appVersionService;
        this.fileAccessBaseUrl = fileAccessBaseUrl;
    }

    @Override
    public FileUploadInfo uploadFile(OperationContext context, String tenantId, String fileName, String appId,
            PartitionedEntity receivedFile) throws IOException {
        AppVersion appVersion = this.appVersionService.retrieval(appId);
        List<FileEntity> files = AippFileUtils.getFileEntity(receivedFile);
        if (files.isEmpty()) {
            throw new AippException(AippErrCode.UPLOAD_FAILED);
        }
        return BeanUtils.copyProperties(
                this.fileService.uploadFile(context, tenantId, fileName, appVersion.getData().getAppSuiteId(),
                        files.get(0)), FileUploadInfo.class);
    }

    @Override
    public FileUploadInfo upload(OperationContext context, String tenantId, String appId,
            FileDeclaration fileDeclaration) {
        return BeanUtils.copyProperties(this.fileService.uploadFile(context, tenantId, appId, fileDeclaration),
                FileUploadInfo.class);
    }

    @Override
    public String getUrl(OperationContext context, FileUploadInfo fileInfo) {
        return buildUrl(this.fileAccessBaseUrl,
                MapBuilder.<String, String>get()
                        .put("filePath", fileInfo.getFilePath())
                        .put("fileName", fileInfo.getFileName())
                        .build());
    }

    @Override
    public byte[] readFile(OperationContext context, String filePath) throws IOException {
        return this.fileService.readFile(filePath, context);
    }

    private static String buildUrl(String baseUrl, Map<String, String> params) {
        StringBuilder urlBuilder = new StringBuilder(baseUrl);
        if (params != null && !params.isEmpty()) {
            boolean firstParam = !baseUrl.contains("?");
            for (Map.Entry<String, String> entry : params.entrySet()) {
                if (firstParam) {
                    urlBuilder.append("?");
                    firstParam = false;
                } else {
                    urlBuilder.append("&");
                }
                String encodedKey = URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8);
                String encodedValue = URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8);
                urlBuilder.append(encodedKey).append("=").append(encodedValue);
            }
        }

        return urlBuilder.toString();
    }
}
