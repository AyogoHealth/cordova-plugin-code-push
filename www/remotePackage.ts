/// <reference path="../typings/codePush.d.ts" />
/// <reference path="../typings/fileTransfer.d.ts" />
/// <reference path="../typings/crypto-js.d.ts" />

"use strict";

declare var cordova: Cordova;

import LocalPackage = require("./localPackage");
import Package = require("./package");
import NativeAppInfo = require("./nativeAppInfo");
import CodePushUtil = require("./codePushUtil");
import CryptoJS = require("crypto-js");

/**
 * Defines a remote package, which represents an update package available for download.
 */
class RemotePackage extends Package implements IRemotePackage {

    private currentFileTransfer: FileTransfer;

    /**
     * The URL at which the package is available for download.
     */
    public downloadUrl: string;

    /**
     * Downloads the package update from the CodePush service.
     *
     * @param downloadSuccess Called with one parameter, the downloaded package information, once the download completed successfully.
     * @param downloadError Optional callback invoked in case of an error.
     */
    public download(successCallback: SuccessCallback<LocalPackage>, errorCallback?: ErrorCallback): void {
        try {
            CodePushUtil.logMessage("Downloading update package ...");
            if (!this.downloadUrl) {
                CodePushUtil.invokeErrorCallback(new Error("The remote package does not contain a download URL."), errorCallback);
            } else {
                this.currentFileTransfer = new FileTransfer();

                var downloadSuccess = (fileEntry: FileEntry) => {
                    this.currentFileTransfer = null;

                    fileEntry.file((file: File) => {

                        // Decrypt the file.
                        // TODO: determine if we need to decrypt.
                        console.log(file);
                        var ivFile = file.slice(0, 16);
                        var cipherFile = file.slice(16);

                        function bin2hex(s: string) {
                          var s2 = "";
                          var c: number;
                          for (var i = 0, l = s.length; i < l; ++i) {
                            c = s.charCodeAt(i);
                            s2 += (c >> 4).toString(16);
                            s2 += (c & 0xF).toString(16);
                          }
                          return s2;
                        }

                        // Read the bytes.
                        var ivReader = new FileReader();
                        ivReader.onloadend = (evt: any) => {
                            var iv = evt.target.result;
                            console.log(bin2hex(iv));

                            var cipherReader = new FileReader();
                            cipherReader.onloadend = (evt: any) => {
                                var ciphertext = evt.target.result;
                                console.log("got ciphertext");

                                var masterKey  = "123abc";
                                var derivedKey = CryptoJS.PBKDF2(masterKey, bin2hex(iv), { keySize: 8, iterations: 1 }).toString();
                                // Decrypt now.
                                console.log("derivedKey", derivedKey);
                                var zipBytes: any = CryptoJS.AES.decrypt(ciphertext, derivedKey, {iv: iv});
                                console.log("decrypted", zipBytes);
                                // save the zip.
                                fileEntry.createWriter((zipWriter) => {
                                  zipWriter.onerror = (evt: any) => {
                                    console.log("could not write zipfile");
                                  };
                                  zipWriter.onwriteend = (evt: any) => {
                                    console.log("wrote zip!");
                                    fileEntry.file(file => {
                                      NativeAppInfo.isFailedUpdate(this.packageHash, (applyFailed: boolean) => {
                                          var localPackage = new LocalPackage();
                                          localPackage.deploymentKey = this.deploymentKey;
                                          localPackage.description = this.description;
                                          localPackage.label = this.label;
                                          localPackage.appVersion = this.appVersion;
                                          localPackage.isMandatory = this.isMandatory;
                                          localPackage.packageHash = this.packageHash;
                                          localPackage.isFirstRun = false;
                                          localPackage.failedApply = applyFailed;
                                          localPackage.localPath = fileEntry.toInternalURL();

                                          CodePushUtil.logMessage("Package download success: " + JSON.stringify(localPackage));
                                          successCallback && successCallback(localPackage);
                                      });
                                    }, (fileError: FileError) => {
                                        CodePushUtil.invokeErrorCallback(new Error("Could not access local package. Error code: " + fileError.code), errorCallback);
                                    });
                                  };

                                  zipWriter.write(zipBytes);
                                });

                            };

                            cipherReader.readAsBinaryString(cipherFile);
                        };

                        ivReader.readAsBinaryString(ivFile);


                    }, (fileError: FileError) => {
                        CodePushUtil.invokeErrorCallback(new Error("Could not access local package. Error code: " + fileError.code), errorCallback);
                    });
                };

                var downloadError = (error: FileTransferError) => {
                    this.currentFileTransfer = null;
                    CodePushUtil.invokeErrorCallback(new Error(error.body), errorCallback);
                };

                this.currentFileTransfer.download(this.downloadUrl, cordova.file.dataDirectory + LocalPackage.DownloadDir + "/" + LocalPackage.PackageUpdateFileName, downloadSuccess, downloadError, true);
            }
        } catch (e) {
            CodePushUtil.invokeErrorCallback(new Error("An error ocurred while downloading the package. " + (e && e.message) ? e.message : ""), errorCallback);
        }
    }

    /**
     * Aborts the current download session, previously started with download().
     *
     * @param abortSuccess Optional callback invoked if the abort operation succeeded.
     * @param abortError Optional callback invoked in case of an error.
     */
    public abortDownload(abortSuccess?: SuccessCallback<void>, abortError?: ErrorCallback): void {
        try {
            if (this.currentFileTransfer) {
                this.currentFileTransfer.abort();

                /* abort succeeded */
                abortSuccess && abortSuccess();
            }
        } catch (e) {
            /* abort failed */
            abortError && abortError(e);
        }
    }
}

export = RemotePackage;
