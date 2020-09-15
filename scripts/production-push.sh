#!/bin/bash

. ./scripts/env_vars.sh

if [ -z "$FTP_HOST" ]; then
    echo "Missing env_vars"
    exit 2
fi

echo "FTP HOST " $FTP_HOST

mkdir -p $PREP_DIR
mkdir -p $PREP_DIR-ui

while getopts rsn option; do
  case "${option}" in
    r) RESETSSH=true;;
    s) BUILD=true;;
    n) NOBUILDSPA=true;;
  esac
done

if [ -z $BUILD ]; then
  rsync -ravz --exclude-from 'scripts/production-exclude.txt' --delete . $PREP_DIR
  rsync -avz  scripts/production-exclude-push.txt $PREP_DIR/production-exclude-push.txt
  rsync -avz  config.php.production $PREP_DIR/config.php

  if [ -z "$NOBUILDSPA" ]; then
    cd ui-notesee
    npm run build
    buildresult=$?
    if [ $buildresult != 0 ]; then
      echo "SPA Build Fail"
      exit 1
    fi
    
    rsync -ravz build/* ../$PREP_DIR-ui/
    cd ..
  fi

else
  echo "Skip Build"
fi

cd $PREP_DIR
echo "start upload"

# setup passwordless ssh
if [ ! -z $RESETSSH ]; then
    echo "Reset ssh key"
    ssh-keygen -f $KEY_DIR -R $FTP_HOST
    ssh-copy-id -f -i ~/.ssh/id_rsa -oHostKeyAlgorithms=+ssh-dss $FTP_USER@$FTP_HOST
else
    echo "Skip SSH Reset"
fi

pwd
FOLDER=$FTP_TARGETFOLDER-api
echo $FOLDER
rsync -rave  'ssh -oHostKeyAlgorithms=+ssh-dss' \
  --exclude-from 'production-exclude-push.txt' \
  --delete . $FTP_USER@$FTP_HOST:$FOLDER/

cd ./$PREP_DIR-ui
pwd
echo $FTP_TARGETFOLDER
rsync -rave  'ssh -oHostKeyAlgorithms=+ssh-dss' \
  --delete . $FTP_USER@$FTP_HOST:$FTP_TARGETFOLDER/

ssh  $FTP_USER@$FTP_HOST "chmod -R 755 $FTP_TARGETFOLDER/"
ssh  $FTP_USER@$FTP_HOST "chmod -R 755 $FTP_TARGETFOLDER-api/"
