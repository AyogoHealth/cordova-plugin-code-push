
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 ALSO, PLEASE DO NOT SUBMIT PULL REQUESTS WITH CHANGES TO THIS FILE. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


/// <reference path="../typings/mocha.d.ts" />
/// <reference path="../typings/node.d.ts" />
"use strict";
var TestUtil = (function () {
    function TestUtil() {
    }
    TestUtil.readTargetEmulator = function () {
        return TestUtil.readMochaCommandLineOption(TestUtil.TARGET_OPTION_NAME);
    };
    TestUtil.readMockServerName = function () {
        return TestUtil.readMochaCommandLineOption(TestUtil.MOCK_SERVER_OPTION_NAME);
    };
    TestUtil.readTargetPlatform = function () {
        return TestUtil.readMochaCommandLineOption(TestUtil.PLATFORM_OPTION_NAME);
    };
    TestUtil.readMochaCommandLineOption = function (optionName) {
        var optionValue = undefined;
        for (var i = 0; i < process.argv.length; i++) {
            if (process.argv[i].indexOf(optionName) === 0) {
                if (i + 1 < process.argv.length) {
                    optionValue = process.argv[i + 1];
                }
                break;
            }
        }
        return optionValue;
    };
    TestUtil.MOCK_SERVER_OPTION_NAME = "--mockserver";
    TestUtil.PLATFORM_OPTION_NAME = "--platform";
    TestUtil.TARGET_OPTION_NAME = "--target";
    return TestUtil;
})();
exports.TestUtil = TestUtil;
