import { SIR_Model } from "model/Model"

class Dummy {
    constructor(height, width) {
      this.height = height;
      this.width = width;
    }

    doSomething () {
        let model = new SIR_Model(30, 5, 2, 0.3, 10, 0.8, 20);
        console.log("Starting Model loop");
        model.run();
    }

}

export {Dummy}