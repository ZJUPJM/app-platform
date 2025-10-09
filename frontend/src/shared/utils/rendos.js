/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { message } from 'antd';

(function (window) {
  window.URL = window.URL || window.webkitURL;
  navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;
  let Recorder = function (stream, config = {}) {
    let audioContext = window.AudioContext || window.webkitAudioContext;
    let context = new audioContext();
    config.channelCount = 1;
    config.numberOfInputChannels = config.channelCount;
    config.numberOfOutputChannels = config.channelCount;
    config.sampleBits = config.sampleBits || 16;
    config.sampleRate = config.sampleRate || 16000;
    config.bufferSize = 4096;
    let audioInput = context.createMediaStreamSource(stream);
    //设置音量节点
    let volume = context.createGain();
    audioInput.connect(volume);
    let recorder = context.createScriptProcessor(
      config.bufferSize,
      config.channelCount,
      config.channelCount
    );
    let audioData = {
      size: 0,
      buffer: [],
      audioArr: [],
      inputSampleRate: context.sampleRate,
      inputSampleBits: 16,
      outputSampleRate: config.sampleRate,
      oututSampleBits: config.sampleBits,
      input: function (data) {
        this.buffer.push(new Float32Array(data));
        this.audioArr = [...this.audioArr, ...data];
        this.size += data.length;
      },
      getRawData: function () {
        //合井压缩
        //合井
        let data = new Float32Array(this.size);
        let offset = 0;
        for (let i = 0; i < this.buffer.length; i++) {
          data.set(this.buffer[i], offset);
          offset += this.buffer[i].length;
        }
        //压缩
        let getRawDataion = parseInt(this.inputSampleRate / this.outputSampleRate);
        let length = data.length / getRawDataion;
        let result = new Float32Array(length);
        let index = 0;
        let j = 0;
        while (index < length) {
          result[index] = data[j];
          j += getRawDataion;
          index++;
        }
        return result;
      },
      getFullWavData: function () {
        let sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate);
        let sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits);
        let bytes = this.getRawData();
        let dataLength = bytes.length * (sampleBits / 8);
        let buffer = new ArrayBuffer(44 + dataLength);
        let data = new DataView(buffer);
        let offset = 0;
        let writeString = function (str) {
          for (let i = 0; i < str.length; ++i) {
            data.setUint8(offset + i, str.charCodeAt(i));
          }
        };
        //资源交换文件标识符
        writeString('RIFF');
        offset += 4;
        //下个地址开始到文件尾总字节数,即文件大小-8
        data.setUint32(offset, 36 + dataLength, true);
        offset += 4;
        //WAV文件标志
        writeString('WAVE');
        offset += 4;
        //波形格式标志
        writeString('fmt ');
        offset += 4;
        //过滤字节,一般为0x10=16
        data.setUint32(offset, 16, true);
        offset += 4;
        //格式类别(PCM形式采样数据)
        data.setUint16(offset, 1, true);
        offset += 2;
        //通道数
        data.setUint16(offset, config.channelCount, true);
        offset += 2;
        //采样率,每秒样本数,表示每个通道的播放速度
        data.setUint32(offset, sampleRate, true);
        offset += 4;
        //波形数据传输率(每秒平均字节数)单声道×每秒数据位数×每样本数据1/8
        data.setUint32(offset, config.channelCount * sampleRate * (sampleBits / 8), true);
        offset += 4;
        //快数据调整数采样一次占用字节数单声道×每样本的数据位数/8
        data.setUint16(offset, config.channelCount * (sampleBits / 8), true);
        offset += 2;
        //每样本数据位数
        data.setUint16(offset, sampleBits, true);
        offset += 2;
        //数据标识符
        writeString('data');
        offset += 4;
        //采样数据总数,即数据总大小-44
        data.setUint32(offset, dataLength, true);
        offset += 4;
        //写入采样数据
        data = this.reshapeWavData(sampleBits, offset, bytes, data);
        return new Blob([data], { type: 'audio/wav' });
      },
      closeContext: function () {
        context.close();
      },
      getPureWavData: function (offset) {
        let sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits);
        let bytes = this.getRawData();
        let dataLength = bytes.length * (sampleBits / 8);
        let buffer = new ArrayBuffer(dataLength);
        let data = new DataView(buffer);
        data = this.reshapeWavData(sampleBits, offset, bytes, data);
        return new Blob([data], { type: 'audio/wav' });
      },
      reshapeWavData: function (sampleBits, offset, iBytes, oData) {
        let offsetCnt = offset;
        if (sampleBits === 8) {
          for (let i = 0; i < iBytes.length; i++, offsetCnt++) {
            let s = Math.max(-1, Math.min(1, iBytes[i]));
            let val = s < 0 ? s * 0x8000 : s * 0x7fff;
            val = parseInt(255 / (65535 / (val + 32768)));
            oData.setInt8(offsetCnt, val, true);
          }
        } else {
          for (let i = 0; i < iBytes.length; i++, offsetCnt += 2) {
            let s = Math.max(-1, Math.min(1, iBytes[i]));
            oData.setInt16(offsetCnt, s < 0 ? s * 0x8000 : s * 0x7fff, true);
          }
        }
        return oData;
      },
      detectSilentSegments: function (data, threshold, frameSize) {
        const silenceFrames = [];
        const totalFrames = Math.ceil(data.length / frameSize);
        for (let i = 0; i < totalFrames; i++) {
          const start = i * frameSize;
          const end = Math.min(start + frameSize, data.length);
          const frame = data.slice(start, end);
          let sum = 0;
          for (let j = 0; j < frameSize; j++) {
            sum += frame[j] * frame[j];
          }
          const rms = Math.sqrt(sum / frameSize);
          const decibel = rms > 0 ? 20 * Math.log10(rms) : -100;
          const isSilent = decibel < threshold;
          silenceFrames.push(isSilent);
        }
        return silenceFrames;
      },
      removeSilentSegments: function (data, silenceFrames, frameSize) {
        const nonSilentData = [];
        for (let i = 0; i < silenceFrames.length; i++) {
          if (!silenceFrames[i]) {
            const start = i * frameSize;
            const end = Math.min(start + frameSize, data.length);
            const frame = data.slice(start, end);
            nonSilentData.push(new Float32Array(frame));
          }
        }
        return nonSilentData;
      },
      processAndSendAudio: function (data) {
        if (data.length === 0) {
          return undefined;
        }
        const frameSize = 16000; //可调整
        const threshold = -30; //可调整
        const silenceFrames = this.detectSilentSegments(data, threshold, frameSize);
        return this.removeSilentSegments(data, silenceFrames, frameSize);
      },
      clear: function () {
        audioData.buffer = [];
        audioData.audioArr = [];
        audioData.size = 0;
      },
    };
    //开始录音
    this.start = function () {
      audioInput.connect(recorder);
      recorder.connect(context.destination);
    };
    //停止
    this.stop = function () {
      recorder.disconnect();
    };
    //获取音频文件
    this.getBlob = function () {
      let nonSilentData = audioData.processAndSendAudio(audioData.audioArr);
      if (nonSilentData === undefined || nonSilentData.length === 0) {
        return false;
      } else {
        audioData.buffer = nonSilentData;
        audioData.size = nonSilentData.length * audioData.inputSampleRate;
        let audioText = audioData.getFullWavData();
        audioData.clear();
        return audioText;
      }
    };
    //回放
    this.play = function (audio) {
      audio.src = window.URL.createObjectURL(this.getBlob());
      audio.onended = function () {
        $('#play').text('Play');
      };
    };
    //停止播放
    this.stopPlay = function (audio) {
      audio.pause();
    };
    this.close = function () {
      audioData.closeContext();
    };
    //音频采集
    recorder.onaudioprocess = function (e) {
      audioData.input(e.inputBuffer.getChannelData(0));
    };
  };
  //抛出异常
  Recorder.throwError = function (msg) {
    message.error(msg);
  };
  //抛出异常
  Recorder.showInfo = function (msg) {
    message.error(msg);
  };
  Recorder.getBlobSize = function () {
    message.error('size');
  };
  //是否支持录音
  Recorder.canRecording = navigator.getUserMedia !== null;
  //获取录音机
  Recorder.get = function (callback, config) {
    if (callback) {
      if (navigator.getUserMedia) {
        navigator.getUserMedia(
          { audio: true },
          (stream) => {
            let rec = new Recorder(stream, config);
            callback(rec);
          },
          (error) => {
            switch (error.code || error.name) {
              case 'PERMISSION DENIED':
              case 'Permission DeniedError':
                Recorder.throwError('用户拒绝提供信息。');
                break;
              case 'NOT SUPPORTED ERROR':
              case 'NotSupportedError':
                Recorder.throwError('浏览器不支持硬件设备。');
                break;
              case 'MANDATORY UNSATISFIED ERROR':
              case 'MandatoryUnsatisfiedError':
                Recorder.throwError('无法发现指定的硬件设备。');
                break;
              default:
                Recorder.throwError('无法打开麦克风。异常信息:' + (error.code || error.name));
                break;
            }
          }
        );
      } else {
        Recorder.throwError('当前浏览器不支持录音功能。');
        return;
      }
    }
  };
  window.HZRecorder = Recorder;
})(window);
