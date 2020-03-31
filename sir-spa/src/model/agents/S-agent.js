import { Agent } from "model/agents/basic-agent"

class Susceptible extends Agent {
    constructor(unique_id, position, model, now_in_center=false,
        last_pos=undefined, infected=false, steps_since_infection=0) {

      super(unique_id, position, model, now_in_center, last_pos);

      this.infected = infected;
      this.steps_since_infection = steps_since_infection;
    }
    
    // step
    step(){
        var to_i = -1;
        var to_r = -1;

        // todo: faster if not whole array?
        // interact with other agents
        if (this.infected) {
            if (this.steps_since_infection > this.model.duration_mean) {
                to_r = this.unique_id;

            } else if (Math.random() < this.model.infection_recoginition_probability) {
                to_i = this.unique_id;

            } else {
                // infected but not recognized
                this.spread_infection();
                // move agent
                this.move()
                // spread in new position
                this.spread_infection();
                this.steps_since_infection += 1;
            }
        }
                
        // interact with admin
        return to_r, to_i
    }

}

export { Susceptible }