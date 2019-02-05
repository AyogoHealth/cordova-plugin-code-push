#if defined(__has_include)
#if __has_include("CDVWKWebViewEngine.h")

#import <Cordova/CDVConfigParser.h>
#import "CDVWKWebViewEngine.h"
#import "CodePush.h"
#import "CodePushPackageMetadata.h"
#import "CodePushPackageManager.h"

@implementation CDVWKWebViewEngine (CodePush)

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-protocol-method-implementation"

- (id)loadRequest:(NSURLRequest*)request {
    if ([self canLoadRequest:request]) {
        if (!request.URL.fileURL) {
            return [(WKWebView*)self.engineWebView loadRequest:request];
        }

        // All file URL requests should be handled with the setServerBasePath in case if it is Ionic app.
        if ([CodePush hasIonicWebViewEngine: self]) {
            [CodePush setServerBasePath:request.URL.path webView: self];

            return nil;
        }

        NSFileManager* fileManager = [NSFileManager defaultManager];
        NSString* bundleHackLocation = [CodePush getBundleHackLocation];

        // Copy original www folder if it doesn't exist
        if(![fileManager fileExistsAtPath: bundleHackLocation]) {
            CPLog(@"%@ doesn't exist. Copying original files...", bundleHackLocation);

            NSString* cdvBundleLocation = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent: @"www"];
            [fileManager copyItemAtPath: cdvBundleLocation toPath: bundleHackLocation error: nil];

#ifdef DEBUG
            NSFileManager * fileManager = [NSFileManager defaultManager];
            NSArray * files = [fileManager contentsOfDirectoryAtPath: bundleHackLocation error: nil];
            CPLog(@"Content: %@", files);
#endif
        }

        NSString* requestPath = request.URL.URLByDeletingLastPathComponent.absoluteString;
        BOOL codePushInstalled = NO;

        // Code push is trying to load the files from a different location. Let's verify if it exists and copy them
        if ([requestPath containsString:@"codepush"]) {
            CodePushPackageMetadata* versionMetadata = [CodePushPackageManager getCurrentPackageMetadata];

            NSString* codePushVersion = versionMetadata.appVersion;
            CPLog(@"Intercepting Code Push request for version %@", codePushVersion);

            if (!versionMetadata) {
                CPLog(@"Could not parse Code Push version!");
            } else {
                NSString* codePushVerificationFilePath = [NSString stringWithFormat:@"%@%@%@", bundleHackLocation, @"/", versionMetadata.appVersion];

                if (![fileManager fileExistsAtPath: codePushVerificationFilePath]) {
                    CPLog(@"Code Push files for version %@ don't exist. Copying files...", codePushVerificationFilePath);

                    // Remove current www folder
                    [fileManager removeItemAtPath: bundleHackLocation error: nil];

                    NSString* codePushPath = [requestPath stringByReplacingOccurrencesOfString: @"file://" withString:@""];
                    NSError* copyError;

                    CPLog(@"Copying Code Push files from %@", codePushPath);

                    [fileManager copyItemAtPath: codePushPath toPath: bundleHackLocation error: &copyError];

                    if (!copyError) {
                        // Write verification file. This will allow us to ignore copying the files later
                        [codePushVersion writeToFile:codePushVerificationFilePath atomically:YES encoding:NSUnicodeStringEncoding error:nil];

                        codePushInstalled = YES;
                    } else {
                        CPLog(@"Could not copy Code Push files. Due to %@", copyError);
                    }

#ifdef DEBUG
                    NSFileManager * fileManager = [NSFileManager defaultManager];
                    NSArray * files = [fileManager contentsOfDirectoryAtPath: bundleHackLocation error: nil];
                    CPLog(@"Content: %@", files);
#endif
                } else {
                    CPLog(@"Code Push files for version %@ already exist. Ignoring...", codePushVerificationFilePath);
                }
            }
        }

        CDVConfigParser* delegate = [[CDVConfigParser alloc] init];
        NSString* configPath = [[NSBundle mainBundle] pathForResource:@"config" ofType:@"xml"];
        NSURL* configUrl = [NSURL fileURLWithPath:configPath];
        NSXMLParser* configParser = [[NSXMLParser alloc] initWithContentsOfURL:configUrl];
        [configParser setDelegate:((id < NSXMLParserDelegate >)delegate)];
        [configParser parse];

        NSString* startPage = nil;

        if (request.URL.pathExtension != nil) {
            startPage = request.URL.lastPathComponent;
        }

        if (startPage == nil && delegate.startPage != nil) {
            startPage = delegate.startPage;
        }
        if (startPage == nil) {
            startPage = @"index.html";
        }

        // Check if we need to append a query string and fragment.
        NSString* originalQueryString = request.URL.query ? [NSString stringWithFormat:@"?%@", request.URL.query] : @"";
        NSString* originalFragment = request.URL.fragment ? [NSString stringWithFormat:@"#%@", request.URL.fragment] : @"";
        NSString* queryFragment = [originalQueryString stringByAppendingString: originalFragment];

        // No matter the url that is passed let's always use our custom one.
        NSURL* newUrl = [NSURL fileURLWithPath: [NSString stringWithFormat:@"%@/%@%@", bundleHackLocation, startPage, queryFragment]];

        CPLog(@"Processing file url request with %@ %@ %@", newUrl, newUrl.query, newUrl.fragment);

        NSURL* readAccessUrl = [newUrl URLByDeletingLastPathComponent];

        id navigation = [(WKWebView*)self.engineWebView loadFileURL:newUrl allowingReadAccessToURL:readAccessUrl];

        if (codePushInstalled) {
            CPLog(@"Code push installed a new version. The webview will reload...");
            navigation = [self.webViewEngine.engineWebView performSelector: @selector(reload)];
        }

        return navigation;

    } else { // can't load, print out error
        NSString* errorHtml = [NSString stringWithFormat:
                               @"<!doctype html>"
                               @"<title>Error</title>"
                               @"<div style='font-size:2em'>"
                               @"   <p>The WebView engine '%@' is unable to load the request: %@</p>"
                               @"   <p>Most likely the cause of the error is that the loading of file urls is not supported in iOS %@.</p>"
                               @"</div>",
                               NSStringFromClass([self class]),
                               [request.URL description],
                               [[UIDevice currentDevice] systemVersion]
                               ];
        return [self loadHTMLString:errorHtml baseURL:nil];
    }
}

#pragma clang diagnostic pop

@end

#endif
#endif
