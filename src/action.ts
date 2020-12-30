export class Action {

  static parse(instance: any) {
    return {

      ...instance,

      type: instance.Type ||
        instance.type ||
        instance.constructor.Type ||
        instance.constructor.type || 
        instance.constructor.name

    }
  }

  static getType(instance: any) {
    return Action.parse(instance).type;
  }

  static withoutType(instance: any) {
    const type = Action.getType(instance);
    const result = {};
    Object.keys(instance).forEach((key) => {
      if (instance[key] !== type) {
        result[key] = instance[key];
      }
    });
    return { ...result };
  }

}
