/*
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2018, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
import osjs from 'osjs';
import {name as applicationName} from './metadata.json';

const createSimpleIframe = (core, proc) => ($content, win) => {
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.setAttribute('border', '0');

  const src = proc.resource('/data/index.html');
  iframe.src = src;

  $content.appendChild(iframe);
};

const createIframe = (core, proc) => ($content, win) => {

  // Create a new bus for our messaging
  const bus = core.make('osjs/event-handler', 'MyIframeApplicationWindow');

  // Get path to iframe content
  const src = proc.resource('/data/index.html');

  // Create DOM element
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.setAttribute('border', '0');

  iframe.addEventListener('load', () => {
    const ref = iframe.contentWindow;

    // This will proxy the window focus events to iframe
    win.on('focus', () => ref.focus());
    win.on('blur', () => ref.blur());

    // Create message sending wrapper
    const sendMessage = msg => ref.postMessage(msg, window.location.href);

    // After connection is established, this handler will process
    // all events coming from iframe.
    proc.on('message', data => {
      console.warn('[Application', 'Iframe sent', data);
      bus.emit(data.method, sendMessage, ...data.args);
    });

    bus.on('yo', (send, args) => sendMessage({
      method: 'yo',
      args: ['MyIframeApplication says hello']
    }));

    // Send the process ID to our iframe to establish communication
    sendMessage({
      method: 'init',
      args: [proc.pid]
    });
  });

  // Finally set the source and attach
  iframe.src = src;

  // Attach
  $content.appendChild(iframe);
};

// Creates the internal callback function when OS.js launches an application
// Note the first argument is the 'name' taken from your metadata.json file
const register = (core, args, options, metadata) => {

  // Create a new Application instance
  const proc = core.make('osjs/application', {
    args,
    options,
    metadata
  });

  // Create  a new Window instance
  proc.createWindow({
    id: 'MyIframeApplicationWindow',
    title: metadata.title.en_EN,
    dimension: {width: 400, height: 400},
    position: {left: 700, top: 200}
  })
    .on('destroy', () => proc.destroy())

    // Create an iframe with messaging etc
    .render(createIframe(core, proc));

  // Or just a simple standard iframe
  // .render(createIframe(core, proc));

  return proc;
};

osjs.register(applicationName, register);
