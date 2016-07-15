
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 ALSO, PLEASE DO NOT SUBMIT PULL REQUESTS WITH CHANGES TO THIS FILE. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
var CheckForUpdateResponseMock = (function () {
    function CheckForUpdateResponseMock() {
    }
    return CheckForUpdateResponseMock;
})();
exports.CheckForUpdateResponseMock = CheckForUpdateResponseMock;
var TestMessage = (function () {
    function TestMessage() {
    }
    TestMessage.CHECK_UP_TO_DATE = "CHECK_UP_TO_DATE";
    TestMessage.CHECK_UPDATE_AVAILABLE = "CHECK_UPDATE_AVAILABLE";
    TestMessage.CHECK_ERROR = "CHECK_ERROR";
    TestMessage.DOWNLOAD_SUCCEEDED = "DOWNLOAD_SUCCEEDED";
    TestMessage.DOWNLOAD_ERROR = "DOWNLOAD_ERROR";
    TestMessage.APPLY_SUCCESS = "APPLY_SUCCESS";
    TestMessage.APPLY_ERROR = "APPLY_ERROR";
    TestMessage.DEVICE_READY_AFTER_UPDATE = "DEVICE_READY_AFTER_UPDATE";
    TestMessage.UPDATE_FAILED_PREVIOUSLY = "UPDATE_FAILED_PREVIOUSLY";
    TestMessage.APPLICATION_NOT_REVERTED = "APPLICATION_NOT_REVERTED";
    TestMessage.NOTIFY_APP_READY_SUCCESS = "NOTIFY_APP_READY_SUCCESS";
    TestMessage.NOTIFY_APP_READY_FAILURE = "NOTIFY_APP_READY_FAILURE";
    TestMessage.SYNC_STATUS = "SYNC_STATUS";
    TestMessage.SYNC_UP_TO_DATE = 0;
    TestMessage.SYNC_APPLY_SUCCESS = 1;
    TestMessage.SYNC_UPDATE_IGNORED = 2;
    TestMessage.SYNC_ERROR = 3;
    return TestMessage;
})();
exports.TestMessage = TestMessage;
var AppMessage = (function () {
    function AppMessage(message, args) {
        this.message = message;
        this.args = args;
    }
    AppMessage.fromString = function (message) {
        return new AppMessage(message, undefined);
    };
    return AppMessage;
})();
exports.AppMessage = AppMessage;
function areEqual(m1, m2) {
    if (m1 === m2) {
        return true;
    }
    if (!m1 || !m2 || m1.message !== m2.message) {
        return false;
    }
    if (m1.args === m2.args) {
        return true;
    }
    if (!m1.args || !m2.args || m1.args.length !== m2.args.length) {
        return false;
    }
    for (var i = 0; i < m1.args.length; i++) {
        if (m1.args[i] !== m2.args[i]) {
            return false;
        }
    }
    return true;
}
exports.areEqual = areEqual;
