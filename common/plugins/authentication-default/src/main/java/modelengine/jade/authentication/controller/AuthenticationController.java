/*
 * Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 * This file is a part of the ModelEngine Project.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

package modelengine.jade.authentication.controller;

import modelengine.fit.http.annotation.GetMapping;
import modelengine.fit.http.annotation.PathVariable;
import modelengine.fit.http.annotation.PostMapping;
import modelengine.fit.http.annotation.RequestBody;
import modelengine.fitframework.annotation.Component;
import modelengine.jade.authentication.AuthenticationService;
import modelengine.jade.authentication.User;
import modelengine.jade.authentication.UserGroup;
import modelengine.jade.authentication.context.UserContext;
import modelengine.jade.authentication.context.UserContextHolder;

import java.util.List;
import java.util.Optional;

/**
 * 用户组接口
 *
 * @author 邬涨财
 * @since 2025-08-18
 */
@Component
public class AuthenticationController {
    private final AuthenticationService authenticationService;

    public AuthenticationController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @GetMapping(path = "/rpc/v1/{userName}/user-resource-groups")
    public List<UserGroup> getUserResource(@PathVariable("userName") String userName) {
        return this.authenticationService.getUserGroups(userName);
    }

    @PostMapping(path = "/rpc/v1/{userName}/user-resource-groups")
    public void setUserResource(@PathVariable("userName") String userName, @RequestBody List<UserGroup> userGroups) {
        this.authenticationService.setUserGroups(userName, userGroups);
    }

    @GetMapping(path = "/v1/api/auth/username")
    public User handleUsername() {
        String username = Optional.ofNullable(UserContextHolder.get()).map(UserContext::getName).orElse("Guest");
        return User.builder().username(username).build();
    }
}
