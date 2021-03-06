import{  EventEmitter } from 'events'
import logger from '../../utils/logger';

class Role extends EventEmitter {
  constructor(think, m = null) {
    logger.verbose('Talker()');
    super();
    this.think = think;
    this.obj = {
      text: [],
      time: [],
      fromId: null,
      roomId: null
    };
    this.m = m;
  }

  setMessage(m){
    this.m = m;
  }

  save(payload) {
    logger.verbose('Talker save(%s)', payload.text);
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
    logger.verbose('Talker load(%s)', text);
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
    logger.verbose('updateTimer(%s)', delayTime);

    if (this.timer) { clearTimeout(this.timer) }
    this.timer = setTimeout(this.finalAction.bind(this), delayTime, 3)
  }

  hear(payload) {
    logger.verbose('Talker hear(%o)', payload);
    this.save(payload);
    this.updateTimer();
  }


  async finalAction() {
    logger.verbose('Talker say()');
    const payload  = this.load();
    try {
      let response = await this.think(payload);

      this.dispatchWechatAction(response);

    }
    catch(err){
      logger.error(err);
    }

    this.timer = undefined;
  }

  dispatchWechatAction(response){
    if (!Array.isArray(response)) {
      response = [response];
    }
    logger.verbose('Wechat Action: %o', response);

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

  delayTime() {
    const minDelayTime = 5000;
    const maxDelayTime = 15000;
    const delayTime = Math.floor(Math.random() * (maxDelayTime - minDelayTime)) + minDelayTime;
    return delayTime;
  }
}

export default Role;
