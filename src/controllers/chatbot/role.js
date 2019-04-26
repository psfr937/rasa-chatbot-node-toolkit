import { EventEmitter } from 'events'
import { Brolog as log } from 'brolog'

class Role extends EventEmitter {
  constructor(think) {
    log.verbose('Talker()');
    super();
    this.think = think;
    this.obj = {
      text: [],
      time: [],
      fromId: null,
      roomId: null
    }
  }

  save(payload) {
    log.verbose('Talker', 'save(%s)', payload.text);
    console.log(payload);
    console.log('saved');
    this.obj.text.push(payload.text);
    this.obj.time.push(Date.now());
    if(this.obj.fromId !== payload.fromId){
      this.obj.fromId = payload.fromId;
    }
    if(this.obj.roomId !== payload.roomId){
      this.obj.roomId = payload.roomId;
    }
  }

  load() {
    const text = this.obj.text.join(', ');
    log.verbose('Talker', 'load(%s)', text);
    let payload = {
      text: this.obj.text.join(', '),
      fromId: this.obj.fromId,
      roomId: this.obj.roomId
    };

    this.obj.text = [];
    this.obj.time = [];
    this.obj.fromId = null;
    this.obj.roomId = null;

    return payload
  }

  updateTimer(delayTime) {
    delayTime = delayTime || this.delayTime();
    log.verbose('Talker', 'updateTimer(%s)', delayTime);

    if (this.timer) { clearTimeout(this.timer) }
    this.timer = setTimeout(this.finalAction.bind(this), delayTime, 3)
  }

  hear(payload) {
    log.verbose('Talker', `hear(${payload})`);
    this.save(payload);
    this.updateTimer();
  }


  async finalAction() {
    log.verbose('Talker', 'say()');
    const payload  = this.load();
    try {
      let response = await this.think(payload);

      console.log('final action start');
      console.log(response);
      console.log(Array.isArray(response));
      console.log('final action end');


      if (!Array.isArray(response)) {
        response = [response];
      }
      response.map(r => {
        const { action } = r;
        switch(action) {
          case 'reply':
            this.emit('reply', r);
            break;
          case 'send':
            this.emit('send', r);
            break;
          case 'forward':
            this.emit('forward', r);
            break;
          default:
            break;
        }
      });
    }
    catch(err){
      console.log(err);
    }

    this.timer = undefined;
  }

  delayTime() {
    const minDelayTime = 5000;
    const maxDelayTime = 15000;
    const delayTime = Math.floor(Math.random() * (maxDelayTime - minDelayTime)) + minDelayTime;
    return delayTime;
  }
}

export default Role;
