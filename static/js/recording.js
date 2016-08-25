/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/
/*
***********
//Adapted for current use
//For more details see: https://webrtc.github.io/samples/src/content/getusermedia/record/
*************
*/
/* globals MediaRecorder */

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html
/**
This library should be used in conjuction with meetings.js.
Start recording should only be possible when window.stram is populated. Typically from meetings.js get Localstrem
or something. I have chosen to let window.stream to be defined in the accompanying script so that I can chose which
stream to record independently.
*/

'use strict';

/* globals MediaRecorder */

var screenStream = null;
var recordStream = null;
var mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
var mediaRecorder;
var recordedBlobs;
var sourceBuffer;

var recordButton = document.getElementById('record');
var downloadButton = document.getElementById('downloadRecord');
recordButton.onclick = toggleRecording;
downloadButton.onclick = download;


function handleError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}



function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  console.log('Recorder stopped: ', event);
}

function toggleRecording() {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
    downloadButton.disabled = false;
  }
}

function acquireRecordStream() {
    return new Promise(function(resolve, reject) {
      startScreen(function(stream){
        recordStream = stream;
        resolve();
      },function() {
        recordStream = window.stream;
        resolve();
      });
    });
}

// The nested try blocks will be simplified when Chrome 47 moves to Stable
function startRecording() {
  acquireRecordStream().then(function(){
      recordedBlobs = [];
      var stream = screenStream === null ? window.stream : screenStream;
      var options = {mimeType: 'video/webm;codecs=vp9'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: 'video/webm;codecs=vp8'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.log(options.mimeType + ' is not Supported');
          options = {mimeType: 'video/webm'};
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.log(options.mimeType + ' is not Supported');
            options = {mimeType: ''};
          }
        }
      }
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.error('Exception while creating MediaRecorder: ' + e);
        alert('Exception while creating MediaRecorder: '
          + e + '. mimeType: ' + options.mimeType);
        return;
      }
      console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
      recordButton.textContent = 'Stop Recording';
      downloadButton.disabled = true;
      mediaRecorder.onstop = handleStop;
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.start(10); // collect 10ms of data
      console.log('MediaRecorder started', mediaRecorder);
    });
}

function stopRecording() {
  mediaRecorder.stop();
  console.log('Recorded Blobs: ', recordedBlobs);
  recordedBlobs = [];
  recordStream = null;
}

function download() {
  var blob = new Blob(recordedBlobs, {type: 'video/webm'});
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'screen-' + new Date();
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

var screenConstraints = null;

if(window.navigator.userAgent.match('Chrome')) {
    //boldly assuming Chrome 34+ and that chrome extension has been installed
     screenConstraints = {
            video: {
                mandatory: {
                    maxWidth: window.screen.width,
                    maxHeight: window.screen.height,
                    chromeMediaSource: 'screen'
                }
            },
            audio: true
    };
} else if (window.navigator.userAgent.match('Firefox')) {
    screenConstraints = {
            video: {
                mozMediaSource: 'screen',
                mediaSource: 'screen'
            },
            audio: true
        };
} else {
    screenConstraints = {
            video: {
                mediaSource: 'screen'
            },
            audio: true
        };
}

function startScreen(successCallback, failCallback) {
    navigator.mediaDevices.getUserMedia(screenConstraints).then(function(stream){
        screenStream = stream;
        if(successCallback)
            successCallback(stream);
    }).catch(function(e) {
    trace('getUserMedia() error: ' + e.name);
    if(failCallback)
        failCallback(stream);
  });

}