
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 ALSO, PLEASE DO NOT SUBMIT PULL REQUESTS WITH CHANGES TO THIS FILE. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


/// <reference path="../typings/mocha.d.ts" />
/// <reference path="../typings/node.d.ts" />
/// <reference path="../typings/assert.d.ts" />
/// <reference path="../typings/codePush.d.ts" />
"use strict";
var tm = require("./projectManager");
var tu = require("./testUtil");
var su = require("./serverUtil");
var platform = require("./platform");
var path = require("path");
var os = require("os");
var assert = require("assert");
var Q = require("q");
var express = require("express");
var bodyparser = require("body-parser");
var projectManager = tm.ProjectManager;
var testUtil = tu.TestUtil;
var templatePath = path.join(__dirname, "../../test/template");
var thisPluginPath = path.join(__dirname, "../..");
var testRunDirectory = path.join(os.tmpdir(), "cordova-plugin-code-push", "test-run");
var updatesDirectory = path.join(os.tmpdir(), "cordova-plugin-code-push", "updates");
var serverUrl = testUtil.readMockServerName();
var targetEmulator = testUtil.readTargetEmulator();
var targetPlatform = platform.PlatformResolver.resolvePlatform(testUtil.readTargetPlatform());
var AndroidKey = "mock-android-deployment-key";
var IOSKey = "mock-ios-deployment-key";
var TestAppName = "TestCodePush";
var TestNamespace = "com.microsoft.codepush.test";
var AcquisitionSDKPluginName = "code-push";
var ScenarioCheckForUpdatePath = "js/scenarioCheckForUpdate.js";
var ScenarioDownloadUpdate = "js/scenarioDownloadUpdate.js";
var ScenarioApply = "js/scenarioApply.js";
var ScenarioApplyWithRevert = "js/scenarioApplyWithRevert.js";
var ScenarioSync = "js/scenarioSync.js";
var ScenarioSyncWithRevert = "js/scenarioSyncWithRevert.js";
var UpdateDeviceReady = "js/updateDeviceReady.js";
var UpdateNotifyApplicationReady = "js/updateNotifyApplicationReady.js";
var UpdateSync = "js/updateSync.js";
var app;
var server;
var mockResponse;
var testMessageCallback;
var mockUpdatePackagePath;
function cleanupScenario() {
    if (server) {
        server.close();
        server = undefined;
    }
}
function setupScenario(scenarioPath) {
    console.log("\nScenario: " + scenarioPath);
    console.log("Mock server url: " + serverUrl);
    console.log("Target platform: " + targetPlatform ? targetPlatform.getCordovaName() : "");
    console.log("Target emulator: " + targetEmulator);
    app = express();
    app.use(bodyparser.json());
    app.use(bodyparser.urlencoded({ extended: true }));
    app.get("/updateCheck", function (req, res) {
        res.send(mockResponse);
        console.log("Update check called from the app.");
    });
    app.get("/download", function (req, res) {
        res.download(mockUpdatePackagePath);
    });
    app.post("/reportTestMessage", function (req, res) {
        console.log("Application reported a test message.");
        console.log("Body: " + JSON.stringify(req.body));
        res.sendStatus(200);
        testMessageCallback(req.body);
    });
    server = app.listen(3000);
    return projectManager.setupTemplate(testRunDirectory, templatePath, serverUrl, AndroidKey, IOSKey, TestAppName, TestNamespace, scenarioPath)
        .then(function () { return projectManager.addPlatform(testRunDirectory, targetPlatform); })
        .then(function () { return projectManager.addPlugin(testRunDirectory, AcquisitionSDKPluginName); })
        .then(function () { return projectManager.addPlugin(testRunDirectory, thisPluginPath); })
        .then(function () { return projectManager.buildPlatform(testRunDirectory, targetPlatform); });
}
function createDefaultResponse() {
    var defaultReponse = new su.CheckForUpdateResponseMock();
    defaultReponse.downloadURL = "";
    defaultReponse.description = "";
    defaultReponse.isAvailable = false;
    defaultReponse.isMandatory = false;
    defaultReponse.appVersion = "";
    defaultReponse.packageHash = "";
    defaultReponse.label = "";
    defaultReponse.packageSize = 0;
    defaultReponse.updateAppVersion = false;
    return defaultReponse;
}
function createMockResponse() {
    var updateReponse = new su.CheckForUpdateResponseMock();
    updateReponse.isAvailable = true;
    updateReponse.appVersion = "1.0.0";
    updateReponse.downloadURL = "mock.url/download";
    updateReponse.isMandatory = true;
    updateReponse.label = "mock-update";
    updateReponse.packageHash = "12345-67890";
    updateReponse.packageSize = 12345;
    updateReponse.updateAppVersion = false;
    return updateReponse;
}
var getMockResponse = function (randomHash) {
    var updateReponse = createMockResponse();
    updateReponse.downloadURL = serverUrl + "/download";
    if (randomHash) {
        updateReponse.packageHash = "randomHash-" + Math.floor(Math.random() * 1000);
    }
    return updateReponse;
};
function setupUpdateProject(scenarioPath, version) {
    console.log("Creating an update at location: " + updatesDirectory);
    return projectManager.setupTemplate(updatesDirectory, templatePath, serverUrl, AndroidKey, IOSKey, TestAppName, TestNamespace, scenarioPath, version)
        .then(function () { return projectManager.addPlatform(updatesDirectory, targetPlatform); })
        .then(function () { return projectManager.addPlugin(testRunDirectory, AcquisitionSDKPluginName); })
        .then(function () { return projectManager.addPlugin(updatesDirectory, thisPluginPath); })
        .then(function () { return projectManager.preparePlatform(updatesDirectory, targetPlatform); });
}
;
function verifyMessages(expectedMessages, deferred) {
    var messageIndex = 0;
    return function (requestBody) {
        try {
            console.log("Message index: " + messageIndex);
            if (typeof expectedMessages[messageIndex] === "string") {
                assert.equal(expectedMessages[messageIndex], requestBody.message);
            }
            else {
                assert(su.areEqual(expectedMessages[messageIndex], requestBody));
            }
            if (++messageIndex === expectedMessages.length) {
                deferred.resolve(undefined);
            }
        }
        catch (e) {
            deferred.reject(e);
        }
    };
}
;
describe("window.codePush", function () {
    this.timeout(100 * 60 * 1000);
    afterEach(function () {
        console.log("Cleaning up!");
        mockResponse = undefined;
        testMessageCallback = undefined;
    });
    describe("#window.codePush.checkForUpdate", function () {
        before(function () {
            return setupScenario(ScenarioCheckForUpdatePath);
        });
        after(function () {
            cleanupScenario();
        });
        it("should handle no update scenario", function (done) {
            var noUpdateReponse = createDefaultResponse();
            noUpdateReponse.isAvailable = false;
            noUpdateReponse.appVersion = "0.0.1";
            mockResponse = { updateInfo: noUpdateReponse };
            testMessageCallback = function (requestBody) {
                try {
                    assert.equal(su.TestMessage.CHECK_UP_TO_DATE, requestBody.message);
                    done();
                }
                catch (e) {
                    done(e);
                }
            };
            console.log("Running project...");
            projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
        });
        it("should return no update in updateAppVersion scenario", function (done) {
            var updateAppVersionReponse = createDefaultResponse();
            updateAppVersionReponse.updateAppVersion = true;
            updateAppVersionReponse.appVersion = "2.0.0";
            mockResponse = { updateInfo: updateAppVersionReponse };
            testMessageCallback = function (requestBody) {
                try {
                    assert.equal(su.TestMessage.CHECK_UP_TO_DATE, requestBody.message);
                    done();
                }
                catch (e) {
                    done(e);
                }
            };
            console.log("Running project...");
            projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
        });
        it("should handle update scenario", function (done) {
            var updateReponse = createMockResponse();
            mockResponse = { updateInfo: updateReponse };
            testMessageCallback = function (requestBody) {
                try {
                    assert.equal(su.TestMessage.CHECK_UPDATE_AVAILABLE, requestBody.message);
                    assert.notEqual(null, requestBody.args[0]);
                    var remotePackage = requestBody.args[0];
                    assert.equal(remotePackage.downloadUrl, updateReponse.downloadURL);
                    assert.equal(remotePackage.isMandatory, updateReponse.isMandatory);
                    assert.equal(remotePackage.label, updateReponse.label);
                    assert.equal(remotePackage.packageHash, updateReponse.packageHash);
                    assert.equal(remotePackage.packageSize, updateReponse.packageSize);
                    done();
                }
                catch (e) {
                    done(e);
                }
            };
            console.log("Running project...");
            projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
        });
        it("should handle error during check for update scenario", function (done) {
            mockResponse = "invalid {{ json";
            testMessageCallback = function (requestBody) {
                try {
                    assert.equal(su.TestMessage.CHECK_ERROR, requestBody.message);
                    done();
                }
                catch (e) {
                    done(e);
                }
            };
            console.log("Running project...");
            projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
        });
    });
    describe("#remotePackage.download", function () {
        before(function () {
            return setupScenario(ScenarioDownloadUpdate);
        });
        after(function () {
            cleanupScenario();
        });
        var getMockResponse = function () {
            var updateReponse = createMockResponse();
            updateReponse.downloadURL = serverUrl + "/download";
            return updateReponse;
        };
        it("should successfully download new updates", function (done) {
            mockResponse = { updateInfo: getMockResponse() };
            mockUpdatePackagePath = path.join(templatePath, "config.xml");
            testMessageCallback = function (requestBody) {
                try {
                    assert.equal(su.TestMessage.DOWNLOAD_SUCCEEDED, requestBody.message);
                    done();
                }
                catch (e) {
                    done(e);
                }
            };
            console.log("Running project...");
            projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
        });
        it("should handle errors during download", function (done) {
            mockResponse = { updateInfo: getMockResponse() };
            mockUpdatePackagePath = path.join(templatePath, "invalid_path.zip");
            testMessageCallback = function (requestBody) {
                try {
                    assert.equal(su.TestMessage.DOWNLOAD_ERROR, requestBody.message);
                    done();
                }
                catch (e) {
                    done(e);
                }
            };
            console.log("Running project...");
            projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
        });
    });
    describe("#localPackage.apply", function () {
        after(function () {
            cleanupScenario();
        });
        before(function () {
            return setupScenario(ScenarioApply);
        });
        var getMockResponse = function () {
            var updateReponse = createMockResponse();
            updateReponse.downloadURL = serverUrl + "/download";
            return updateReponse;
        };
        it("should handle unzip errors", function (done) {
            mockResponse = { updateInfo: getMockResponse() };
            mockUpdatePackagePath = path.join(templatePath, "config.xml");
            testMessageCallback = function (requestBody) {
                try {
                    assert.equal(su.TestMessage.APPLY_ERROR, requestBody.message);
                    done();
                }
                catch (e) {
                    done(e);
                }
            };
            console.log("Running project...");
            projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
        });
        it("should handle apply", function (done) {
            mockResponse = { updateInfo: getMockResponse() };
            setupUpdateProject(UpdateDeviceReady, "Update 1")
                .then(projectManager.createUpdateArchive.bind(undefined, updatesDirectory, targetPlatform))
                .then(function (updatePath) {
                var deferred = Q.defer();
                mockUpdatePackagePath = updatePath;
                testMessageCallback = verifyMessages([su.TestMessage.APPLY_SUCCESS, su.TestMessage.DEVICE_READY_AFTER_UPDATE], deferred);
                console.log("Running project...");
                projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
                return deferred.promise;
            })
                .done(done, done);
        });
    });
    describe("#localPackage.apply (with revert)", function () {
        after(function () {
            cleanupScenario();
        });
        before(function () {
            return setupScenario(ScenarioApplyWithRevert);
        });
        it("should handle revert", function (done) {
            mockResponse = { updateInfo: getMockResponse(false) };
            setupUpdateProject(UpdateDeviceReady, "Update 1 (bad update)")
                .then(projectManager.createUpdateArchive.bind(undefined, updatesDirectory, targetPlatform))
                .then(function (updatePath) {
                var deferred = Q.defer();
                mockUpdatePackagePath = updatePath;
                testMessageCallback = verifyMessages([su.TestMessage.APPLY_SUCCESS, su.TestMessage.DEVICE_READY_AFTER_UPDATE, su.TestMessage.UPDATE_FAILED_PREVIOUSLY], deferred);
                console.log("Running project...");
                projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
                return deferred.promise;
            })
                .then(function () {
                console.log("Creating a second failed update.");
                var deferred = Q.defer();
                mockResponse = { updateInfo: getMockResponse(true) };
                testMessageCallback = verifyMessages([su.TestMessage.APPLY_SUCCESS, su.TestMessage.DEVICE_READY_AFTER_UPDATE, su.TestMessage.UPDATE_FAILED_PREVIOUSLY], deferred);
                console.log("Running project...");
                projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
                return deferred.promise;
            })
                .done(done, done);
        });
        it("should not revert on success", function (done) {
            mockResponse = { updateInfo: getMockResponse(true) };
            setupUpdateProject(UpdateNotifyApplicationReady, "Update 1 (good update)")
                .then(projectManager.createUpdateArchive.bind(undefined, updatesDirectory, targetPlatform))
                .then(function (updatePath) {
                var deferred = Q.defer();
                mockUpdatePackagePath = updatePath;
                testMessageCallback = verifyMessages([su.TestMessage.APPLY_SUCCESS, su.TestMessage.DEVICE_READY_AFTER_UPDATE, su.TestMessage.NOTIFY_APP_READY_SUCCESS, su.TestMessage.APPLICATION_NOT_REVERTED], deferred);
                console.log("Running project...");
                projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
                return deferred.promise;
            })
                .done(done, done);
        });
    });
    describe("#window.codePush.sync (no revert)", function () {
        after(function () {
            cleanupScenario();
        });
        before(function () {
            return setupScenario(ScenarioSync);
        });
        it("sync should handle no update scenario", function (done) {
            var noUpdateReponse = createDefaultResponse();
            noUpdateReponse.isAvailable = false;
            noUpdateReponse.appVersion = "0.0.1";
            mockResponse = { updateInfo: noUpdateReponse };
            testMessageCallback = function (requestBody) {
                try {
                    assert(su.areEqual(requestBody, new su.AppMessage(su.TestMessage.SYNC_STATUS, [su.TestMessage.SYNC_UP_TO_DATE])));
                    done();
                }
                catch (e) {
                    done(e);
                }
            };
            console.log("Running project...");
            projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
        });
        it("should handle error during check for update scenario", function (done) {
            mockResponse = "invalid {{ json";
            testMessageCallback = function (requestBody) {
                try {
                    assert(su.areEqual(requestBody, new su.AppMessage(su.TestMessage.SYNC_STATUS, [su.TestMessage.SYNC_ERROR])));
                    done();
                }
                catch (e) {
                    done(e);
                }
            };
            console.log("Running project...");
            projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
        });
        it("should handle errors during download", function (done) {
            var invalidUrlResponse = createMockResponse();
            invalidUrlResponse.downloadURL = path.join(templatePath, "invalid_path.zip");
            mockResponse = { updateInfo: invalidUrlResponse };
            testMessageCallback = function (requestBody) {
                try {
                    assert(su.areEqual(requestBody, new su.AppMessage(su.TestMessage.SYNC_STATUS, [su.TestMessage.SYNC_ERROR])));
                    done();
                }
                catch (e) {
                    done(e);
                }
            };
            console.log("Running project...");
            projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
        });
        it("sync should apply when update available", function (done) {
            mockResponse = { updateInfo: getMockResponse(false) };
            setupUpdateProject(UpdateDeviceReady, "Update 1 (good update)")
                .then(projectManager.createUpdateArchive.bind(undefined, updatesDirectory, targetPlatform))
                .then(function (updatePath) {
                var deferred = Q.defer();
                mockUpdatePackagePath = updatePath;
                testMessageCallback = verifyMessages([new su.AppMessage(su.TestMessage.SYNC_STATUS, [su.TestMessage.SYNC_APPLY_SUCCESS]), su.TestMessage.DEVICE_READY_AFTER_UPDATE], deferred);
                console.log("Running project...");
                projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
                return deferred.promise;
            })
                .done(done, done);
        });
    });
    describe("#window.codePush.sync (with revert)", function () {
        after(function () {
            cleanupScenario();
        });
        before(function () {
            return setupScenario(ScenarioSyncWithRevert);
        });
        it("sync should handle revert", function (done) {
            mockResponse = { updateInfo: getMockResponse(false) };
            setupUpdateProject(UpdateDeviceReady, "Update 1 (bad update)")
                .then(projectManager.createUpdateArchive.bind(undefined, updatesDirectory, targetPlatform))
                .then(function (updatePath) {
                var deferred = Q.defer();
                mockUpdatePackagePath = updatePath;
                testMessageCallback = verifyMessages([new su.AppMessage(su.TestMessage.SYNC_STATUS, [su.TestMessage.SYNC_APPLY_SUCCESS]), su.TestMessage.DEVICE_READY_AFTER_UPDATE, new su.AppMessage(su.TestMessage.SYNC_STATUS, [su.TestMessage.SYNC_UP_TO_DATE])], deferred);
                console.log("Running project...");
                projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
                return deferred.promise;
            })
                .done(done, done);
        });
        it("sync should not revert on success", function (done) {
            mockResponse = { updateInfo: getMockResponse(true) };
            setupUpdateProject(UpdateSync, "Update 1 (good update)")
                .then(projectManager.createUpdateArchive.bind(undefined, updatesDirectory, targetPlatform))
                .then(function (updatePath) {
                var deferred = Q.defer();
                mockUpdatePackagePath = updatePath;
                testMessageCallback = verifyMessages([new su.AppMessage(su.TestMessage.SYNC_STATUS, [su.TestMessage.SYNC_APPLY_SUCCESS]), su.TestMessage.DEVICE_READY_AFTER_UPDATE, su.TestMessage.APPLICATION_NOT_REVERTED], deferred);
                console.log("Running project...");
                projectManager.runPlatform(testRunDirectory, targetPlatform, true, targetEmulator);
                return deferred.promise;
            })
                .done(done, done);
        });
    });
});
