
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 ALSO, PLEASE DO NOT SUBMIT PULL REQUESTS WITH CHANGES TO THIS FILE. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


/// <reference path="../typings/codePush.d.ts" />
/// <reference path="../typings/fileTransfer.d.ts" />
/// <reference path="../typings/crypto-js.d.ts" />
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var LocalPackage = require("./localPackage");
var Package = require("./package");
var NativeAppInfo = require("./nativeAppInfo");
var CodePushUtil = require("./codePushUtil");
var CryptoJS = require("crypto-js");
var RemotePackage = (function (_super) {
    __extends(RemotePackage, _super);
    function RemotePackage() {
        _super.apply(this, arguments);
    }
    RemotePackage.prototype.download = function (successCallback, errorCallback) {
        var _this = this;
        try {
            CodePushUtil.logMessage("Downloading update package ...");
            if (!this.downloadUrl) {
                CodePushUtil.invokeErrorCallback(new Error("The remote package does not contain a download URL."), errorCallback);
            }
            else {
                this.currentFileTransfer = new FileTransfer();
                var downloadSuccess = function (fileEntry) {
                    _this.currentFileTransfer = null;
                    fileEntry.file(function (file) {
                        console.log(file);
                        var ivFile = file.slice(0, 16);
                        var cipherFile = file.slice(16);
                        function bin2hex(s) {
                            var s2 = "";
                            var c;
                            for (var i = 0, l = s.length; i < l; ++i) {
                                c = s.charCodeAt(i);
                                s2 += (c >> 4).toString(16);
                                s2 += (c & 0xF).toString(16);
                            }
                            return s2;
                        }
                        var ivReader = new FileReader();
                        ivReader.onloadend = function (evt) {
                            var iv = evt.target.result;
                            console.log(bin2hex(iv));
                            var cipherReader = new FileReader();
                            cipherReader.onloadend = function (evt) {
                                var ciphertext = evt.target.result;
                                console.log("got ciphertext");
                                var masterKey = "123abc";
                                var derivedKey = CryptoJS.PBKDF2(masterKey, bin2hex(iv), { keySize: 8, iterations: 1 }).toString();
                                console.log("derivedKey", derivedKey);
                                var zipBytes = CryptoJS.AES.decrypt(ciphertext, derivedKey, { iv: iv });
                                console.log("decrypted", zipBytes);
                                fileEntry.createWriter(function (zipWriter) {
                                    zipWriter.onerror = function (evt) {
                                        console.log("could not write zipfile");
                                    };
                                    zipWriter.onwriteend = function (evt) {
                                        console.log("wrote zip!");
                                        fileEntry.file(function (file) {
                                            NativeAppInfo.isFailedUpdate(_this.packageHash, function (applyFailed) {
                                                var localPackage = new LocalPackage();
                                                localPackage.deploymentKey = _this.deploymentKey;
                                                localPackage.description = _this.description;
                                                localPackage.label = _this.label;
                                                localPackage.appVersion = _this.appVersion;
                                                localPackage.isMandatory = _this.isMandatory;
                                                localPackage.packageHash = _this.packageHash;
                                                localPackage.isFirstRun = false;
                                                localPackage.failedApply = applyFailed;
                                                localPackage.localPath = fileEntry.toInternalURL();
                                                CodePushUtil.logMessage("Package download success: " + JSON.stringify(localPackage));
                                                successCallback && successCallback(localPackage);
                                            });
                                        }, function (fileError) {
                                            CodePushUtil.invokeErrorCallback(new Error("Could not access local package. Error code: " + fileError.code), errorCallback);
                                        });
                                    };
                                    zipWriter.write(zipBytes);
                                });
                            };
                            cipherReader.readAsBinaryString(cipherFile);
                        };
                        ivReader.readAsBinaryString(ivFile);
                    }, function (fileError) {
                        CodePushUtil.invokeErrorCallback(new Error("Could not access local package. Error code: " + fileError.code), errorCallback);
                    });
                };
                var downloadError = function (error) {
                    _this.currentFileTransfer = null;
                    CodePushUtil.invokeErrorCallback(new Error(error.body), errorCallback);
                };
                this.currentFileTransfer.download(this.downloadUrl, cordova.file.dataDirectory + LocalPackage.DownloadDir + "/" + LocalPackage.PackageUpdateFileName, downloadSuccess, downloadError, true);
            }
        }
        catch (e) {
            CodePushUtil.invokeErrorCallback(new Error("An error ocurred while downloading the package. " + (e && e.message) ? e.message : ""), errorCallback);
        }
    };
    RemotePackage.prototype.abortDownload = function (abortSuccess, abortError) {
        try {
            if (this.currentFileTransfer) {
                this.currentFileTransfer.abort();
                abortSuccess && abortSuccess();
            }
        }
        catch (e) {
            abortError && abortError(e);
        }
    };
    return RemotePackage;
})(Package);
module.exports = RemotePackage;
