#import <AppKit/AppKit.h>
#import <AVFoundation/AVFoundation.h>
#import <CoreVideo/CoreVideo.h>
#import <Foundation/Foundation.h>

static const size_t VideoWidth = 1920;
static const size_t VideoHeight = 1080;
static const int32_t FramesPerSecond = 30;
static const NSInteger FramesPerSlide = 90;
static const NSInteger TransitionFrames = 18;

static CGImageRef LoadImage(NSString *path) {
    NSImage *image = [[NSImage alloc] initWithContentsOfFile:path];
    if (image == nil) {
        return nil;
    }

    NSRect proposedRect = NSMakeRect(0, 0, image.size.width, image.size.height);
    CGImageRef cgImage = [image CGImageForProposedRect:&proposedRect
                                              context:nil
                                                hints:nil];
    if (cgImage != nil) {
        CFRetain(cgImage);
    }
    return cgImage;
}

static void DrawImage(CGContextRef context, CGImageRef image, CGFloat alpha) {
    CGFloat imageWidth = (CGFloat)CGImageGetWidth(image);
    CGFloat imageHeight = (CGFloat)CGImageGetHeight(image);
    CGFloat scale = MIN(VideoWidth / imageWidth, VideoHeight / imageHeight);
    CGFloat drawWidth = imageWidth * scale;
    CGFloat drawHeight = imageHeight * scale;
    CGRect drawRect = CGRectMake(
        (VideoWidth - drawWidth) / 2.0,
        (VideoHeight - drawHeight) / 2.0,
        drawWidth,
        drawHeight
    );

    CGContextSaveGState(context);
    CGContextSetAlpha(context, alpha);
    CGContextDrawImage(context, drawRect, image);
    CGContextRestoreGState(context);
}

static CVPixelBufferRef CreateFrame(
    CGImageRef currentImage,
    CGImageRef nextImage,
    CGFloat transitionProgress,
    CFDictionaryRef pixelBufferAttributes
) {
    CVPixelBufferRef pixelBuffer = nil;
    CVReturn status = CVPixelBufferCreate(
        kCFAllocatorDefault,
        VideoWidth,
        VideoHeight,
        kCVPixelFormatType_32ARGB,
        pixelBufferAttributes,
        &pixelBuffer
    );
    if (status != kCVReturnSuccess || pixelBuffer == nil) {
        return nil;
    }

    CVPixelBufferLockBaseAddress(pixelBuffer, 0);
    void *baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    CGContextRef context = CGBitmapContextCreate(
        baseAddress,
        VideoWidth,
        VideoHeight,
        8,
        bytesPerRow,
        colorSpace,
        (CGBitmapInfo)kCGImageAlphaNoneSkipFirst
    );
    CGColorSpaceRelease(colorSpace);

    if (context == nil) {
        CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
        CVPixelBufferRelease(pixelBuffer);
        return nil;
    }

    CGContextSetRGBFillColor(context, 6.0 / 255.0, 18.0 / 255.0, 28.0 / 255.0, 1);
    CGContextFillRect(context, CGRectMake(0, 0, VideoWidth, VideoHeight));

    CGContextSetInterpolationQuality(context, kCGInterpolationHigh);

    DrawImage(context, currentImage, 1);
    if (nextImage != nil && transitionProgress > 0) {
        DrawImage(context, nextImage, transitionProgress);
    }

    CGContextRelease(context);
    CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
    return pixelBuffer;
}

int main(void) {
    @autoreleasepool {
        NSString *assetDirectory =
            @"/Users/odaineforbes/Desktop/pathologic/marketing/linkedin-pathologix";
        NSArray<NSString *> *imageNames = @[
            @"01-landing-page.png",
            @"02-emt-scene.png",
            @"05-scenario-trainer.png",
            @"03-flashcards.png",
            @"04-flashcards-answer.png",
        ];

        NSMutableArray *images = [NSMutableArray arrayWithCapacity:imageNames.count];
        for (NSString *name in imageNames) {
            NSString *path = [assetDirectory stringByAppendingPathComponent:name];
            CGImageRef image = LoadImage(path);
            if (image == nil) {
                NSLog(@"Could not load %@", path);
                return 1;
            }
            [images addObject:(__bridge id)image];
            CGImageRelease(image);
        }

        NSString *outputPath =
            [assetDirectory stringByAppendingPathComponent:@"pathologix-linkedin-preview.mp4"];
        NSURL *outputURL = [NSURL fileURLWithPath:outputPath];
        [[NSFileManager defaultManager] removeItemAtURL:outputURL error:nil];

        NSError *error = nil;
        AVAssetWriter *writer = [[AVAssetWriter alloc] initWithURL:outputURL
                                                         fileType:AVFileTypeMPEG4
                                                            error:&error];
        if (writer == nil) {
            NSLog(@"Could not create video writer: %@", error);
            return 1;
        }

        NSDictionary *outputSettings = @{
            AVVideoCodecKey: AVVideoCodecTypeH264,
            AVVideoWidthKey: @(VideoWidth),
            AVVideoHeightKey: @(VideoHeight),
            AVVideoCompressionPropertiesKey: @{
                AVVideoAverageBitRateKey: @6000000,
                AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
            },
        };
        AVAssetWriterInput *writerInput =
            [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo
                                               outputSettings:outputSettings];
        writerInput.expectsMediaDataInRealTime = NO;

        NSDictionary *pixelBufferAttributes = @{
            (NSString *)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32ARGB),
            (NSString *)kCVPixelBufferWidthKey: @(VideoWidth),
            (NSString *)kCVPixelBufferHeightKey: @(VideoHeight),
        };
        AVAssetWriterInputPixelBufferAdaptor *adaptor =
            [AVAssetWriterInputPixelBufferAdaptor
                assetWriterInputPixelBufferAdaptorWithAssetWriterInput:writerInput
                                           sourcePixelBufferAttributes:pixelBufferAttributes];

        if (![writer canAddInput:writerInput]) {
            NSLog(@"Video writer could not add its input.");
            return 1;
        }
        [writer addInput:writerInput];

        if (![writer startWriting]) {
            NSLog(@"Could not start video writer: %@", writer.error);
            return 1;
        }
        [writer startSessionAtSourceTime:kCMTimeZero];

        int64_t frameIndex = 0;
        for (NSInteger imageIndex = 0; imageIndex < images.count; imageIndex++) {
            CGImageRef currentImage = (__bridge CGImageRef)images[imageIndex];
            CGImageRef nextImage = imageIndex < images.count - 1
                ? (__bridge CGImageRef)images[imageIndex + 1]
                : nil;

            for (NSInteger slideFrame = 0; slideFrame < FramesPerSlide; slideFrame++) {
                while (!writerInput.readyForMoreMediaData) {
                    [NSThread sleepForTimeInterval:0.002];
                }

                BOOL isTransitioning =
                    nextImage != nil &&
                    slideFrame >= FramesPerSlide - TransitionFrames;
                CGFloat transitionProgress = 0;
                if (isTransitioning) {
                    transitionProgress =
                        (CGFloat)(slideFrame - (FramesPerSlide - TransitionFrames) + 1) /
                        (CGFloat)TransitionFrames;
                }

                CVPixelBufferRef pixelBuffer = CreateFrame(
                    currentImage,
                    nextImage,
                    transitionProgress,
                    (__bridge CFDictionaryRef)pixelBufferAttributes
                );
                if (pixelBuffer == nil) {
                    NSLog(@"Could not create frame %lld.", frameIndex);
                    return 1;
                }

                CMTime presentationTime = CMTimeMake(frameIndex, FramesPerSecond);
                BOOL appended = [adaptor appendPixelBuffer:pixelBuffer
                                      withPresentationTime:presentationTime];
                CVPixelBufferRelease(pixelBuffer);
                if (!appended) {
                    NSLog(@"Could not append frame %lld: %@", frameIndex, writer.error);
                    return 1;
                }
                frameIndex += 1;
            }
        }

        [writerInput markAsFinished];
        dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
        [writer finishWritingWithCompletionHandler:^{
            dispatch_semaphore_signal(semaphore);
        }];
        dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);

        if (writer.status != AVAssetWriterStatusCompleted) {
            NSLog(@"Video export did not complete: %@", writer.error);
            return 1;
        }

        AVURLAsset *videoAsset = [AVURLAsset URLAssetWithURL:outputURL options:nil];
        AVAssetImageGenerator *imageGenerator =
            [AVAssetImageGenerator assetImageGeneratorWithAsset:videoAsset];
        imageGenerator.appliesPreferredTrackTransform = YES;
        CMTime actualTime = kCMTimeZero;
        CGImageRef previewFrame = [imageGenerator
            copyCGImageAtTime:CMTimeMakeWithSeconds(7.5, 600)
                   actualTime:&actualTime
                        error:&error];
        if (previewFrame == nil) {
            NSLog(@"Could not create the video verification frame: %@", error);
            return 1;
        }

        NSBitmapImageRep *previewRepresentation =
            [[NSBitmapImageRep alloc] initWithCGImage:previewFrame];
        CGImageRelease(previewFrame);
        NSData *previewPNG = [previewRepresentation
            representationUsingType:NSBitmapImageFileTypePNG
                         properties:@{}];
        NSString *previewPath =
            [assetDirectory stringByAppendingPathComponent:@"video-preview-frame.png"];
        if (![previewPNG writeToFile:previewPath atomically:YES]) {
            NSLog(@"Could not save the video verification frame.");
            return 1;
        }

        NSLog(@"Created %@", outputPath);
    }
    return 0;
}
