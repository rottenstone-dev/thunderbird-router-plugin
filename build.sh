#!/bin/bash
rm thunderbird-one-click-forward.xpi && zip -r thunderbird-one-click-forward.xpi * -x "*.git*" "*.DS_Store" "build.sh"
