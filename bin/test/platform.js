
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 ALSO, PLEASE DO NOT SUBMIT PULL REQUESTS WITH CHANGES TO THIS FILE. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


/// <reference path="../typings/node.d.ts" />
"use strict";
var path = require("path");
var Android = (function () {
    function Android() {
    }
    Android.getInstance = function () {
        if (!this.instance) {
            this.instance = new Android();
        }
        return this.instance;
    };
    Android.prototype.getCordovaName = function () {
        return "android";
    };
    Android.prototype.getPlatformWwwPath = function (projectDirectory) {
        return path.join(projectDirectory, "platforms/android/assets/www");
    };
    return Android;
})();
exports.Android = Android;
var IOS = (function () {
    function IOS() {
    }
    IOS.getInstance = function () {
        if (!this.instance) {
            this.instance = new IOS();
        }
        return this.instance;
    };
    IOS.prototype.getCordovaName = function () {
        return "ios";
    };
    IOS.prototype.getPlatformWwwPath = function (projectDirectory) {
        return path.join(projectDirectory, "platforms/ios/www");
    };
    return IOS;
})();
exports.IOS = IOS;
var PlatformResolver = (function () {
    function PlatformResolver() {
    }
    PlatformResolver.resolvePlatform = function (cordovaPlatformName) {
        for (var i = 0; i < this.supportedPlatforms.length; i++) {
            if (this.supportedPlatforms[i].getCordovaName() === cordovaPlatformName) {
                return this.supportedPlatforms[i];
            }
        }
        console.error("Unsupported platform: " + cordovaPlatformName);
        return undefined;
    };
    PlatformResolver.supportedPlatforms = [Android.getInstance(), IOS.getInstance()];
    return PlatformResolver;
})();
exports.PlatformResolver = PlatformResolver;
