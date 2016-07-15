
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 ALSO, PLEASE DO NOT SUBMIT PULL REQUESTS WITH CHANGES TO THIS FILE. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


/// <reference path="../typings/codePush.d.ts" />
/// <reference path="../typings/q.d.ts" />
/// <reference path="../typings/node.d.ts" />
/// <reference path="../typings/replace.d.ts" />
/// <reference path="../typings/mkdirp.d.ts" />
"use strict";
var child_process = require("child_process");
var replace = require("replace");
var path = require("path");
var Q = require("q");
var fs = require("fs");
var mkdirp = require("mkdirp");
var del = require("del");
var archiver = require("archiver");
var ProjectManager = (function () {
    function ProjectManager() {
    }
    ProjectManager.setupTemplate = function (destinationPath, templatePath, serverURL, androidKey, iosKey, appName, appNamespace, jsPath, appVersion) {
        if (appVersion === void 0) { appVersion = ProjectManager.DEFAULT_APP_VERSION; }
        var configXmlPath = path.join(destinationPath, "config.xml");
        var indexHtmlPath = path.join(destinationPath, "www/index.html");
        var indexJsPath = path.join(destinationPath, "www/" + jsPath);
        if (fs.existsSync(destinationPath)) {
            del.sync([destinationPath], { force: true });
        }
        mkdirp.sync(destinationPath);
        return ProjectManager.execAndLogChildProcess("cordova create " + destinationPath + " " + appNamespace + " " + appName + " --copy-from " + templatePath)
            .then(ProjectManager.replaceString.bind(undefined, configXmlPath, ProjectManager.ANDROID_KEY_PLACEHOLDER, androidKey))
            .then(ProjectManager.replaceString.bind(undefined, configXmlPath, ProjectManager.IOS_KEY_PLACEHOLDER, iosKey))
            .then(ProjectManager.replaceString.bind(undefined, configXmlPath, ProjectManager.SERVER_URL_PLACEHOLDER, serverURL))
            .then(ProjectManager.replaceString.bind(undefined, indexHtmlPath, ProjectManager.SERVER_URL_PLACEHOLDER, serverURL))
            .then(ProjectManager.replaceString.bind(undefined, indexHtmlPath, ProjectManager.INDEX_JS_PLACEHOLDER, jsPath))
            .then(ProjectManager.replaceString.bind(undefined, indexHtmlPath, ProjectManager.CODE_PUSH_APP_VERSION_PLACEHOLDER, appVersion))
            .then(ProjectManager.replaceString.bind(undefined, indexJsPath, ProjectManager.SERVER_URL_PLACEHOLDER, serverURL));
    };
    ProjectManager.updateProject = function (destinationPath, templatePath, version, platform, jsPath, serverURL) {
        var templateIndexPath = path.join(templatePath, "www/index.html");
        var destination = path.join(destinationPath, "www/index.html");
        return ProjectManager.copyFile(templateIndexPath, destinationPath, true)
            .then(ProjectManager.replaceString.bind(undefined, destination, ProjectManager.SERVER_URL_PLACEHOLDER, serverURL))
            .then(ProjectManager.replaceString.bind(undefined, destination, ProjectManager.INDEX_JS_PLACEHOLDER, jsPath))
            .then(ProjectManager.replaceString.bind(undefined, destination, ProjectManager.CODE_PUSH_APP_VERSION_PLACEHOLDER, version));
    };
    ProjectManager.createUpdateArchive = function (projectLocation, targetPlatform) {
        var deferred = Q.defer();
        var archive = archiver.create("zip", {});
        var archivePath = path.join(projectLocation, "update.zip");
        console.log("Creating a project update archive at: " + archivePath);
        if (fs.existsSync(archivePath)) {
            fs.unlinkSync(archivePath);
        }
        var writeStream = fs.createWriteStream(archivePath);
        var targetFolder = targetPlatform.getPlatformWwwPath(projectLocation);
        writeStream.on("close", function () {
            deferred.resolve(archivePath);
        });
        archive.on("error", function (e) {
            deferred.reject(e);
        });
        archive.directory(targetFolder, "www");
        archive.pipe(writeStream);
        archive.finalize();
        return deferred.promise;
    };
    ProjectManager.addPlugin = function (projectFolder, plugin) {
        return ProjectManager.execAndLogChildProcess("cordova plugin add " + plugin, { cwd: projectFolder });
    };
    ProjectManager.buildPlatform = function (projectFolder, targetPlatform) {
        return ProjectManager.execAndLogChildProcess("cordova build " + targetPlatform.getCordovaName(), { cwd: projectFolder });
    };
    ProjectManager.preparePlatform = function (projectFolder, targetPlatform) {
        return ProjectManager.execAndLogChildProcess("cordova prepare " + targetPlatform.getCordovaName(), { cwd: projectFolder });
    };
    ProjectManager.runPlatform = function (projectFolder, targetPlatform, skipBuild, target) {
        if (skipBuild === void 0) { skipBuild = false; }
        var runTarget = target ? " --target " + target : "";
        var nobuild = skipBuild ? " --nobuild" : "";
        return ProjectManager.execAndLogChildProcess("cordova run " + targetPlatform.getCordovaName() + runTarget + nobuild, { cwd: projectFolder });
    };
    ProjectManager.addPlatform = function (projectFolder, targetPlatform) {
        return ProjectManager.execAndLogChildProcess("cordova platform add " + targetPlatform.getCordovaName(), { cwd: projectFolder });
    };
    ProjectManager.replaceString = function (filePath, regex, replacement) {
        replace({ regex: regex, replacement: replacement, recursive: false, silent: false, paths: [filePath] });
    };
    ProjectManager.execAndLogChildProcess = function (command, options) {
        var deferred = Q.defer();
        options = options || {};
        options.maxBuffer = 1024 * 500;
        console.log("Running command: " + command);
        child_process.exec(command, options, function (error, stdout, stderr) {
            stdout && console.log(stdout);
            stderr && console.error(stderr);
            if (error) {
                console.error(error);
                deferred.reject(error);
            }
            else {
                deferred.resolve(undefined);
            }
        });
        return deferred.promise;
    };
    ProjectManager.copyFile = function (source, destination, overwrite) {
        var deferred = Q.defer();
        try {
            var errorHandler = function (error) {
                deferred.reject(error);
            };
            if (overwrite && fs.existsSync(destination)) {
                fs.unlinkSync(destination);
            }
            var readStream = fs.createReadStream(source);
            readStream.on("error", errorHandler);
            var writeStream = fs.createWriteStream(destination);
            writeStream.on("error", errorHandler);
            writeStream.on("close", deferred.resolve.bind(undefined, undefined));
            readStream.pipe(writeStream);
        }
        catch (e) {
            deferred.reject(e);
        }
        return deferred.promise;
    };
    ProjectManager.ANDROID_KEY_PLACEHOLDER = "CODE_PUSH_ANDROID_DEPOYMENT_KEY";
    ProjectManager.IOS_KEY_PLACEHOLDER = "CODE_PUSH_IOS_DEPLOYMENT_KEY";
    ProjectManager.SERVER_URL_PLACEHOLDER = "CODE_PUSH_SERVER_URL";
    ProjectManager.INDEX_JS_PLACEHOLDER = "CODE_PUSH_INDEX_JS_PATH";
    ProjectManager.CODE_PUSH_APP_VERSION_PLACEHOLDER = "CODE_PUSH_APP_VERSION";
    ProjectManager.DEFAULT_APP_VERSION = "Store version";
    return ProjectManager;
})();
exports.ProjectManager = ProjectManager;
