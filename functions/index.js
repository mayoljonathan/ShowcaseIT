'use strict';

const functions = require('firebase-functions');
const mkdirp = require('mkdirp-promise');
// Include a Service Account Key to use a Signed URL
const gcs = require('@google-cloud/storage')({keyFilename: 'showcaseit-te1-firebase-adminsdk-3i494-2ae7301489.json'});
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Authenticate to Algolia Database.
// TODO: Make sure you configure the `algolia.app_id` and `algolia.api_key` Google Cloud environment variables.
const algoliasearch = require('algoliasearch');
const client = algoliasearch(functions.config().algolia.app_id, functions.config().algolia.api_key);

const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

// HOST
const apiKey = functions.config().project.api_key;
const email = functions.config().mailer.email;
const password = functions.config().mailer.password;

// APKREADER
const ApkReader = require('node-apk-parser');

// HTTP
const request = require('request');

/**
 * When an image is uploaded in the Storage bucket We generate a thumbnail automatically using
 * ImageMagick.
 * After the thumbnail has been generated and uploaded to Cloud Storage,
 * we write the public URL to the Firebase Realtime Database.
 */
exports.generateThumbnail = functions.storage.object().onChange(event => {
  // Thumbnail prefix added to file names.
  const THUMB_PREFIX = 'thumb_';
  const filePath = event.data.name;
  const fileName = path.basename(filePath);

  // Exit if this is triggered on a file that is not an image.
  if (!event.data.contentType.startsWith('image/')) {
    console.log('This is not an image.');
    return;
  }
  // Exit if the image is already a thumbnail.
  if (fileName.startsWith(THUMB_PREFIX)) {
    console.log('Already a Thumbnail.');
    return;
  }
  // Exit if this is a move or deletion event.
  if (event.data.resourceState === 'not_exists') {
    console.log('This is a deletion event.');
    return;
  }

  // Max height and width of the thumbnail in pixels.
  const THUMB_MAX_HEIGHT = 600;
  const THUMB_MAX_WIDTH = 600;
  
  // File and directory paths.
  const fileDir = path.dirname(filePath);
  const thumbFilePath = path.normalize(path.join(fileDir, `${THUMB_PREFIX}${fileName}`));
  const tempLocalFile = path.join(os.tmpdir(), filePath);
  const tempLocalDir = path.dirname(tempLocalFile);
  const tempLocalThumbFile = path.join(os.tmpdir(), thumbFilePath);

  // Cloud Storage files.
  const bucket = gcs.bucket(event.data.bucket);
  const file = bucket.file(filePath);
  const thumbFile = bucket.file(thumbFilePath);

  // Create the temp directory where the storage file will be downloaded.
  return mkdirp(tempLocalDir).then(() => {
    // Download file from bucket.
    return file.download({destination: tempLocalFile});
  }).then(() => {
    console.log('The file has been downloaded to', tempLocalFile);
    // Generate a thumbnail using ImageMagick.
    return spawn('convert', [tempLocalFile, '-thumbnail', `${THUMB_MAX_WIDTH}x${THUMB_MAX_HEIGHT}>`, tempLocalThumbFile]);
  }).then(() => {
    console.log('Thumbnail created at', tempLocalThumbFile);
    // Uploading the Thumbnail.
    return bucket.upload(tempLocalThumbFile, {destination: thumbFilePath});
  }).then(() => {
    console.log('Thumbnail uploaded to Storage at', thumbFilePath);
    // Once the image has been uploaded delete the local files to free up disk space.
    fs.unlinkSync(tempLocalFile);
    fs.unlinkSync(tempLocalThumbFile);
    // Get the Signed URLs for the thumbnail and original image.
    // const config = {
    //   action: 'read',
    //   expires: '03-01-2500'
    // };
    // return Promise.all([
    //   thumbFile.getSignedUrl(config),
    //   file.getSignedUrl(config)
    // ]);
  });
  // .then(results => {
  //   console.log('Got Signed URLs.');
  //   const thumbResult = results[0];
  //   const originalResult = results[1];
  //   const thumbFileUrl = thumbResult[0];
  //   const fileUrl = originalResult[0];
  //   // Add the URLs to the Database
  //   return admin.database().ref('images').push({path: fileUrl, thumbnail: thumbFileUrl});
  // });
});


exports.deletePendingDeletedApps = functions.https.onRequest((req, res) => {
  if(req.query.apiKey === apiKey){
    // let setServerTime = admin.database().ref(`_server/time`).update({serverTime: admin.database.ServerValue.TIMESTAMP});
    // let getServerTime = admin.database().ref(`_server/time/serverTime`).once('value').then(snapshot => {return snapshot.val()});
    
    // Promise.all([setServerTime,getServerTime]).then(result=>{
        // Retrieve the pending_deleted apps
        // let serverTime = result[1];
        let serverTime = Date.now();
        admin.database().ref(`_server/pending_deletion/user_personal_apps`).once('value', snapshot =>{
            var data = {};
            snapshot.forEach(childSnapshot => {
                let app = childSnapshot.val();
                if(app.scheduledDeletion <= serverTime){
                    // Remove from pending deletion node
                    data[`_server/pending_deletion/user_personal_apps/${app.uid}`] = null;
                    // Remove from personal apps
                    data[`users/developer_data/${app.user_uid}/user_personal_apps/${app.uid}`] = null;

                    // Get the application in the applicationsRoot
                    admin.database().ref(`applications/${app.uid}`).once('value', appDataSnap=>{
                      let appData = appDataSnap.val();
                      appData['archivedByUserType'] = 'user';
                      appData['archivedByUserUid'] = app.user_uid;
                      appData['archivedDate'] = Date.now();

                      data[`_archive/applications/${app.uid}`] = appData;

                      // delete in the applications
                      admin.database().ref(`applications/${app.uid}`).remove();
                    });
                }
            });

            let deleteAppsLength = Object.keys(data).length / 2;
            let returnData = {
              code: 200,
              response: 'Operation successfully completed.'
            }
            if(deleteAppsLength > 0){
                console.log(`Deleting ${deleteAppsLength} apps from DB`);
                return admin.database().ref('/').update(data).then(()=>{
                  // return admin.database().ref(`applications/${app.uid}`).remove().then(()=>{
                    return res.status(200).send(returnData);
                  // });
                });
            }
            console.log('No scheduled pending deleted apps right now. Alright!');
            return res.status(200).send(returnData);
        });
    // });

  }else{
    return res.status(403).send({
      code: 403,
      response: 'You are not allowed to do the operation.'
    });
  }
});

exports.processPendingParseApk = functions.database.ref(`_server/pending_request/parseApk/{app_uid}`).onCreate(event=>{
  let requestData = event.data.val();
  request(`https://us-central1-showcaseit-te1.cloudfunctions.net/parseApk?apiKey=${apiKey}&user_uid=${requestData.user_uid}&app_uid=${requestData.app_uid}&remoteFilepath=${requestData.remoteFilepath}&releaseCode=${requestData.releaseCode}&demoDownloadURL=${requestData.demoDownloadURL}&demoFilename=${requestData.demoFilename}&demoFileSize=${requestData.demoFileSize}` , { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    console.log('Now requesting to parse the APK');
    console.log(body);
    if(body.code === 200){
      // Delete the pendingParseApk from Firebase database
      return admin.database().ref(`_server/pending_request/parseApk/${requestData.app_uid}`).remove();
    }else{
      console.log(`Status code is ${body.code}: Error in doing the request for parsing the Apk`);
      let data = {};
      data[`_server/pending_request/parseApk/${requestData.app_uid}`] = null;
      data[`users/developer_data/${requestData.user_uid}/user_personal_apps/${requestData.app_uid}/platforms/android/releases/${requestData.releaseCode}/errorParsingApk`] = true;
      data[`users/developer_data/${requestData.user_uid}/user_personal_apps/${requestData.app_uid}/platforms/android/releases/${requestData.releaseCode}/dateCreated`] = Date.now();
      return admin.database().ref('/').update(data);
    }
  });
  
});

exports.parseApk = functions.https.onRequest((req, res) => {
  if(req.query.apiKey === apiKey && 
     req.query.user_uid  !== '' && 
     req.query.app_uid !== '' && 
     req.query.remoteFilepath !== '' && 
     req.query.releaseCode != '' &&
     req.query.demoDownloadURL != '' &&
     req.query.demoFilename != '' &&
     req.query.demoFileSize != ''
  ){
    const bucket = gcs.bucket('showcase-it.appspot.com');

    // Path in which gcs will download
    let remoteFilepath = req.query.remoteFilepath;

    // Nodes in firebase database
    let user_uid = req.query.user_uid;
    let app_uid = req.query.app_uid;

    let releaseCode = req.query.releaseCode;
    let demoDownloadURL = req.query.demoDownloadURL;
    let demoFilename = req.query.demoFilename;
    let demoFileSize = req.query.demoFileSize;

    let preview = req.query.preview || false;

    // Enable CORS
    res.set('Access-Control-Allow-Origin', "*");
    res.set('Access-Control-Allow-Methods', 'GET, POST');

    return bucket
          .file(remoteFilepath)
          .download()
          .then((data)=>{
            let base64file = data[0].toString('base64');
            let decodedAPK = new Buffer(base64file.toString(), 'base64');

            let reader = ApkReader.readFile(decodedAPK)
            let manifest = reader.readManifestSync();

            console.log('Successfully parsed APK');
            let apkData = {
              versionCode: manifest.versionCode,
              versionName: manifest.versionName,
              packageName: manifest.package,
              usesPermissions: manifest.usesPermissions,
              usesSdk: manifest.usesSdk,
              supportsScreens: manifest.supportsScreens,

              dateCreated: Date.now(),
              // releaseCode: releaseCode,
              demoDownloadURL: demoDownloadURL,
              demoFilename: demoFilename,
              demoFileSize: demoFileSize
            };

            // If preview, return the apkData but not updating it to firebase yet
            if(preview){
              return res.status(200).send({
                code: 200,
                response: 'APK has been parsed successfully.',
                data: apkData
              });
            }

            // Update your app android data in firebase database
            var multiPathData = {};
            multiPathData[`users/developer_data/${user_uid}/user_personal_apps/${app_uid}/platforms/android/releases/${releaseCode}`] = apkData;

            return admin.database().ref('/').update(multiPathData).then(()=>{
              return res.status(200).send({
                code: 200,
                response: 'APK has been parsed successfully and updates are sent to database.'
              });
            });           

          }).catch(e=>{
            console.log("Error");
            console.log(e);
            return res.status(415).send({
              code: 415,
              response: 'Error in parsing the Apk. Apk file might be invalid.'
            });
          });
          
  }else{
    return res.status(403).send({
      code: 403,
      response: 'You are not allowed to do the operation. Some parameters may be missing.'
    });
  }
  
});  

// MAIL SERVICE
exports.sendRequestEmail = functions.https.onRequest((req,res)=>{
  var nodemailer = require('nodemailer');
  // Grab the text parameter.
  if(req.query.apiKey === apiKey && req.query.data){
    // Enable CORS
    res.set('Access-Control-Allow-Origin', "*");
    res.set('Access-Control-Allow-Methods', 'GET, POST');

    let mail = JSON.parse(decodeURIComponent(req.query.data));

    let reasonsInString = '';
    if(mail.reasons && mail.action !== 'approve'){
      mail.reasons.forEach(r=>{
          reasonsInString += `<b>${r.name}</b> - ${r.message}<br>`;
      });
    }

    let type = 'publish request';
    if(mail.requestType === 'content_update_requests'){
      type = 'content update request';
    }


    if(mail.action === 'approve' || mail.action === 'approve_cu'){
      var body = 
      `<p>Hi there <b>${mail.usersName}</b>!</p>`+
      `<p>Your ${type} for your application <b>${mail.appTitle}</b> was approved! <a href='https://showcase-it.firebaseapp.com/#/app/${mail.appUid}'>View your app</a> now in ShowcaseIT.</p>`+
      `<p>Website: <a href='https://showcase-it.firebaseapp.com/'>https://showcase-it.firebaseapp.com</a></p>`+
      `<p>Thanks,</p>`+
      `<span>Your ShowcaseIT Team</span>`;
    }else{
      var body = 
      `<p>Hi there <b>${mail.usersName}</b>!</p>`+
      `<p>Your ${type} for your application <b>${mail.appTitle}</b> was ${mail.action == 'reject' ? 'rejected' : 'rejected and removed from your applications list'} for violating our <a href='https://showcase-it.firebaseapp.com/app_content_guidelines.html'>Application Content Guidelines</a></p>`+
      `<p>Reason/s:</p>`+
      `${reasonsInString}`+    
      `<p>Website: <a href='https://showcase-it.firebaseapp.com/'>https://showcase-it.firebaseapp.com</a></p>`+
      `<p>Thanks,</p>`+
      `<span>Your ShowcaseIT Team</span>`;
    }

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email,
        pass: password,
      }
    });
    // Subject when approved
    let subject = `${mail.appTitle} was approved!`;
    var mailOptions = {
      from: `'ShowcaseIT Team 👻'<${email}>`,
      to: mail.email,
      subject: mail.action !== 'approve' && mail.action !== 'approve_cu' ? `${mail.appTitle} was ${mail.action == 'reject' ? 'rejected!' : 'rejected and removed!'}` : subject,
      html: body
    };

    transporter.sendMail(mailOptions,(error,info)=>{
      if (error) {
        console.log('Email failed: '+error);
        res.status(500).send(error);
      } else {
        console.log('Email sent: ' + info.response);
        res.status(250).send({
          code: 250,
          response: 'Email sent successfully.'
        });
      }
    });
  }else{
    return res.status(403).send({
      code: 403,
      response: 'You are not allowed to do the operation. Some parameters may be missing.'
    });
  }

});

exports.addAdministrator = functions.https.onRequest((req,res)=>{
  var nodemailer = require('nodemailer');
  // Grab the text parameter.
  if(req.query.apiKey === apiKey && req.query.data){
    let data = JSON.parse(decodeURIComponent(req.query.data));
    // Declaration
    var createAdministrator = () => {
      return admin.auth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.name,
      });
    }
    var addAdministratorInDB = (data) =>{
      return admin.database().ref(`_admin/${data.uid}`).update({
        email: data.email,
        name: data.name,
        status: 'active',
        uid: data.uid,
        isSuperAdmin: data.superAdmin,
        dateCreated: Date.now()
      });
    }
    var sendMail = () => {
      return new Promise((resolve,reject)=>{
        var body = 
          `<p>Hi <b>${data.name}</b>!</p>`+
          `<p>Your ${data.superAdmin ? 'Super Administrator' : 'Administrator'} account has been created. You can now sign-in using your credentials below: </p>`+
          `<p>Email: ${data.email} <br> Password: ${data.password} </p>`+
          `<p><b>Note: Make sure to change your password after signing in.</b></p>`+
          `<p>Admin Panel Website: <a href='https://showcase-it-apanel.github.io/'>https://showcase-it-apanel.github.io</a><br>`+
          `Main Website: <a href='https://showcase-it.firebaseapp.com/'>https://showcase-it-firebaseapp.com</a></p>`+
          `<p>Thanks,</p>`+
          `<span>Your ShowcaseIT Team</span>`;

          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: email,
              pass: password,
            }
          });
          var mailOptions = {
            from: `'ShowcaseIT Team 👻'<${email}>`,
            to: data.email,
            subject: `Account created`,
            html: body
          };

          transporter.sendMail(mailOptions,(error,info)=>{
            if (error) { reject(500);} 
            else { resolve(250);}
          });
      });
    }

    // Enable CORS
    res.set('Access-Control-Allow-Origin', "*");
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    
    createAdministrator().then(userData=>{
      data['uid'] = userData.uid;
      addAdministratorInDB(data).then(()=>{
        sendMail().then(mailRes=>{
          return res.status(250).send({
            code: 250,
            response: 'Email sent successfully.'
          });
        },e=>{
          return res.status(500).send(e);
        });
      },e=>{
        return res.status(500).send(e);
      });
    },e=>{
      return res.status(500).send(e);
    });
    
  }else{
    return res.status(403).send({
      code: 403,
      response: 'You are not allowed to do the operation. Some parameters may be missing.'
    });
  }

});



// SEARCH SERVICE
// Name for the algolia index for applications.
const ALGOLIA_APP_INDEX = 'applications';
const ALGOLIA_USERS_INDEX = 'users';

exports.indexUsersEntry = functions.database.ref('users/user_data/{user_uid}').onWrite(event => {
  const index = client.initIndex(ALGOLIA_USERS_INDEX);

  let userData = event.data.val();

  const algoliaData = {
    user_uid: userData.uid,
    name: userData.name,
    objectID: event.data.key
  };

  return index.saveObject(algoliaData).then(()=> {
    admin.database().ref(`_server/user_sync/last_index_timestamp`).set(Date.parse(event.timestamp));
  })
});

// Updates the search index when new apps are created or updated.
exports.indexEntry = functions.database.ref('applications/{app_uid}').onWrite(event => {
  const index = client.initIndex(ALGOLIA_APP_INDEX);

  console.log('INDEX ENTRY');
  console.log(event);
  console.log(event.data.val());

  let app_uid = event.params.app_uid;
  let appData = event.data.val();

  if(appData && appData.uid){
    console.log('UPDATE ENTRY');
    const algoliaData = {
      app_uid: appData.uid,
      user_uid: appData.user_uid,
      title: appData.title,
      short_description: appData.short_description,
      objectID: event.data.key
    };

    return index.saveObject(algoliaData).then(()=> {
      admin.database().ref(`_server/application_sync/last_index_timestamp`).set(Date.parse(event.timestamp));
    });
  }else{
    // THIS IS A DELETE
    console.log('A DELETE ENTRY');
    return index.deleteObject(app_uid).then(()=> {
      admin.database().ref(`_server/application_sync/last_index_timestamp`).set(Date.parse(event.timestamp));
    });
  }
});

// Starts a search query whenever a query is requested (by adding one to the `/search/queries`
// element. Search results are then written under `/search/results`.
exports.searchEntry = functions.database.ref('_search/queries/{user_uid}/{query_uid}').onWrite(event => {
  const index = client.initIndex(ALGOLIA_APP_INDEX);
  const query = event.data.val().query;
  const user_uid = event.params.user_uid;
  const query_uid = event.params.query_uid;

  return index.search(query).then(content => {
    const updates = {
      '_search/last_query_timestamp': Date.parse(event.timestamp)
    };
    updates[`_search/results/${user_uid}/${query_uid}`] = content;
    return admin.database().ref().update(updates);
  });
});