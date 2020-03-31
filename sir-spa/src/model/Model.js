import { Susceptible } from "model/agents/S-agent"
import { Removed } from "model/agents/R-agent"
import { Infected } from "model/agents/I-agent"
import { Space } from "model/Space"

class SIR_Model {
  // agent based SIR-Model
    constructor(
        population=200, 
        initial_infected=5, 
        infection_radius=2,
        infection_probability_onContact=0.25,
        duration_mean=10,
        infection_recoginition_probability=0.8,
        max_step=200
        ) {

      this.population = population;
      this.initial_infected = initial_infected;
      this.infection_radius = infection_radius;
      this.infection_probability_onContact = infection_probability_onContact;
      this.duration_mean = duration_mean;
      this.infection_recoginition_probability = infection_recoginition_probability;
      this.max_step = max_step;
      this.movement = "random";

      this.width = 20
      this.height = 20
      
    }

    reset() {
      if (typeof this.s_list !== "undefined") {
        //this.s_list.forEach(function(agent){ delete agent }); // no destructor?
        delete this.s_list;
      }

      if (typeof this.r_list !== "undefined") {
        //this.r_list.forEach(function(agent){ delete agent });
        delete this.r_list
      }

      if (typeof this.i_list !== "undefined") {
        //this.i_list.forEach(function(agent){ delete agent });
        delete this.i_list
      }
      if (typeof this.space !== "undefined") {
        delete this.space
      }

      // del every agent ?
    }

    initialize() {
      this.s_list = [];
      this.r_list = [];
      this.i_list = [];

      this.space = new Space(this.width, this.height);

      // setup population
      var unique_id;
      for (unique_id of range(1, (this.population - this.initial_infected))) {
        var pos = this.space.get_random_position_empty();

        var new_agent = new Susceptible(unique_id, pos, this);

        this.s_list.push(new_agent);
        
        this.space.add_agent(new_agent, pos);
      }

      //setup infected agents
      for (var u2 of range((unique_id + 1), (unique_id + this.initial_infected))) {
        pos = this.space.get_random_position_empty();

        new_agent = new Infected(u2, pos, this);

        this.i_list.push(new_agent);
        
        this.space.add_agent(new_agent, pos);
      }
    }

    move_to_r(list_uids, from) {
      var uid;
      var agent;

      for (uid of list_uids) {
        if (from == "s") {
          agent = this.s_list.filter(function(value, index, arr){ return value.unique_id === uid;})[0];

          // delete
          this.s_list = this.s_list.filter(function(value, index, arr){ return value.unique_id !== uid;})
          // agent undefined?
          this.space.remove_agent(agent);

        } else if (from == "i") {
          agent = this.i_list.filter(function(value, index, arr){ return value.unique_id === uid;})[0];

          // delete
          this.s_list = this.i_list.filter(function(value, index, arr){ return value.unique_id !== uid;})
          this.space.remove_agent(agent);

        } else {
          console.log("Error switching class to Removed")
        }

        // add new
        var new_agent = new Removed(agent.unique_id, agent.position, this, 
          agent.now_in_center, agent.last_pos);

        this.r_list.push(new_agent);        
        this.space.add_agent(new_agent, new_agent.position);
      }
    }

    move_to_i(list_uids) {
      var uid;

      for (uid of list_uids) {
        var agent = this.s_list.filter(function(value, index, arr){ return value.unique_id === uid;})[0];

        // delete
        this.s_list = this.s_list.filter(function(value, index, arr){ return value.unique_id !== uid;})
        this.space.remove_agent(agent);

        // add new
        var new_agent = new Infected(agent.unique_id, agent.position, this, 
          agent.now_in_center, agent.last_pos, agent.steps_since_infection);

        this.i_list.push(new_agent);        
        this.space.add_agent(new_agent, new_agent.position);
      }
    }

    step_s(){
      var to_r = [];
      var to_i = [];

      // iterate over every agent in s_list - apply step
      for (var key in this.s_list) {
        var add_r, add_i = this.s_list[key].step(); // if class change -> no move
        if (add_r >= 0) {
          to_r.push(add_r);

        } else if (add_i >= 0) {
          to_i.push(add_i);

        }
      }
      
      // move agents to other class
      if (to_r.length > 0) {
        this.move_to_r(to_r, "s");
      } else if (to_i.length > 0) {
        this.move_to_i(to_i);
      }

      // calculate count
      var healthy = this.s_list.filter(function (el) {
        return !el.infected
      });

      // return for statistics
      return [healthy.length, this.s_list.length - healthy.length] 
    }

    step_i(){
      var to_r = [];

      // iterate over every agent in s_list - apply step
      for (var key in this.i_list) {
        var add_r = this.i_list[key].step();
        if (add_r >= 0) {
          to_r.push(add_r);
        }
      }

      // move agents to other class
      if (to_r.length > 0) {
        this.move_to_r(to_r, "i");
      }

      // return for statistics
      return this.i_list.length - to_r.length
    }
      
    step_r() {

      // iterate over every agent in s_list - apply step
      for (var key in this.r_list) {
        this.r_list[key].step();
      }

      // return for statistics
      return this.r_list.length
    }

    step() {
      var num_sus = this.step_s()
      var num_inf = this.step_i()
      var num_rem = this.step_r()
      // print canvas +
      // set current statistics as info for dashboard
      console.log("Susceptible:" + num_sus[0]);
      console.log("Susceptible with Infection:" + num_sus[1]);
      console.log("Identified Infected:" + num_inf);
      console.log("Removed - Recovered:" + num_rem);
      console.log("Basic Reproduction Number:" + "todo");

      // DEBUG Movement:
      /*
      var current_world = this.space.world;
      console.log("printing step: "+ num)
      for(var i = 0; i < current_world.length; i++) {
        for(var z = 0; z < current_world.length; z++) {
          console.log(current_world[z][i]);
        }
      }
      */
    }


    // remove sleep - regelmäßiges aufrufen - step methoden bei aufruf
    async run() {
      this.reset()
      this.initialize()
      for (var i of range(1, this.max_step)) {
        console.log("step"+i);
        
        this.step()
        // world state - > from 
        // this.s_list = [];
        // this.r_list = [];
        // this.i_list = [];

        await Sleep(500);
      }
    }
  }

function range(start, end) {
    var ans = [];
    for (let i = start; i <= end; i++) {
        ans.push(i);
    }
    return ans;
}

function Sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export {SIR_Model}