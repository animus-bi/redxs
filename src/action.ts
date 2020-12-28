export class Action {

  static parse(instance: any) {
    return {

      ...instance,

      type: instance.type || 
        instance.constructor.Type || 
        instance.constructor.type || 
        instance.constructor.name

    }
  }

  static getType(instance: any) {
    return this.parse(instance).type;
  }

}