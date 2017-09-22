/*! Rappid v2.1.0 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2015 client IO

 2017-09-21 


This Source Code Form is subject to the terms of the Rappid Trial License
, v. 2.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_v2.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/


var SCOPES = 'https://www.googleapis.com/auth/drive';
// console/project/api&auth/credentials/oAuth/CLIENT_ID
var CLIENT_ID = 'YOUR_CLIENT_ID';
// console/project/api&auth/credentials/public_api_access/API_KEY
var DEVELOPER_KEY = 'YOUR_DEVELOPER_KEY';
// received after successfull authorization
var AUTH_TOKEN;

// requires: google picker api enabled

var gapi = window.gapi;
var google = window.google;

window.gdAuth = function(callback, immediate) {

    if (!AUTH_TOKEN) {
        
        gapi.auth.authorize({
            
            'client_id': CLIENT_ID,
            'scope': SCOPES,
            'immediate': immediate
            
        }, function(authResult) {

            if (authResult && !authResult.error) {

                gapi.client.load('drive', 'v2', function() {
                    AUTH_TOKEN = authResult.access_token;
                    callback();
                });

            } else {

                if (immediate) window.gdAuth(callback, false);
            }
        });

    } else {

        callback();
    }
};

window.gdLoad = function(callback) {

    function createPicker() {

        var view = new google.picker.View(google.picker.ViewId.DOCS);
        
        view.setMimeTypes('application/octet-stream').setQuery('*.json');

        var picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .setAppId(CLIENT_ID)
            .setOAuthToken(AUTH_TOKEN)
            .addView(view)
            .addView(new google.picker.DocsUploadView())
            .setDeveloperKey(DEVELOPER_KEY)
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    }

    function pickerCallback(data) {

        if (data.action == google.picker.Action.PICKED) {

            var request = gapi.client.drive.files.get({
                'fileId': data.docs[0].id
            });

            request.execute(function(resp) {
                
                var xhr = new XMLHttpRequest();
                xhr.open('GET', resp.downloadUrl);
                xhr.setRequestHeader('Authorization', 'Bearer ' + AUTH_TOKEN);
                xhr.onload = function() { callback(resp.title, xhr.responseText); };
                xhr.send();
            });
        }
    }

    gapi.load('picker', { callback: createPicker });
};

window.gdSave = function(name, content, callback) {

    var boundary = '-------314159265358979323846';
    var delimiter = '\r\n--' + boundary + '\r\n';
    var close_delim = '\r\n--' + boundary + '--';

    var contentType = 'application/octet-stream';
    var metadata = {
        'title': (name || 'JointJS - BPMN') + '.json',
        'mimeType': contentType
    };

    var base64Data = btoa(content);
    var multipartRequestBody =
            delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64Data +
        close_delim;

    var request = gapi.client.request({
        'path': '/upload/drive/v2/files',
        'method': 'POST',
        'params': { 'uploadType': 'multipart' },
        'headers': { 'Content-Type': 'multipart/mixed; boundary="' + boundary + '"' },
        'body': multipartRequestBody
    });

    callback = callback || function(file) { console.log(file); };

    request.execute(callback);
};
