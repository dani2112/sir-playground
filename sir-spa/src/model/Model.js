import { Susceptible } from "model/agents/S-agent"
import { Removed } from "model/agents/R-agent"
import { Infected } from "model/agents/I-agent"
import { Space } from "model/Space"

// Todo: movement grid -> continuous
// distanzen - kontinuerliche längenangaben.

// zeit realer zeitschritt - realistische geschwindigkeit
// -> energy / life movementt

// potentialfelder - je typ
// zeitlich anderes verhalten? hotspots aktiv - option nicht default

// Gruppen durchmischung - ähnlicher ausgangsort
// initial gruppe zuweisen ?

class SIR_Model {
  // agent based SIR-Model
    constructor(
        population=200, 
        initial_infected=5, 
        infection_radius=2,
        infection_probability_onContact=0.25,
        duration_mean=10,
        infection_recoginition_probability=0.8,
        max_step=400
        ) {

      this.population = population;
      this.initial_infected = initial_infected;
      this.infection_radius = infection_radius;
      this.infection_probability_onContact = infection_probability_onContact;
      this.duration_mean = duration_mean;
      this.infection_recoginition_probability = infection_recoginition_probability;
      this.steps_till_symptoms = 2;
      this.max_step = max_step;
      this.movement = "random";
      this.repulsion_range = 5; // has to be greater than infection range

      this.width = 50;
      this.height = 50;

      this.steps_each_day = 48; // half an hour
      this.step_num = 0;
      this.day = 0;
      this.current_mode = "night";
      // schedule - night - morning - work - afterwork - evening
      this.schedule = {
        "night": 15,
        "morning": 19,
        "work": 35,
        "afterwork": 41,
        "evening": 47
      }
      this.schedule_random_activity = {
        "night": 0.1,
        "morning": 0.8,
        "work": 0.3,
        "afterwork": 2,
        "evening": 0.8
      }
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
      if (this.infection_radius > this.repulsion_range) {
        console.log("Error: Infection range has to be smaller or equal to repulsion range. Set to repulsion range");
        this.infection_radius = this.repulsion_range;
      }

      // agents
      this.s_list = [];
      this.r_list = [];
      this.i_list = [];

      // R0
      this.old_R = [0, 0, 0];
      this.old_I = [this.initial_infected, this.initial_infected, this.initial_infected];
      this.old_S = [this.population - this.initial_infected, this.population - this.initial_infected, this.population - this.initial_infected];
      this.R_array = [1.0, 1.0]; // Todo

      // grid world model
      this.space = new Space(this.width, this.height);
      
      // schedule
      this.day = 0;
      this.step_num = 0;
      this.current_mode = "night";

      // setup population
      var unique_id;
      for (unique_id of range(1, (this.population - this.initial_infected))) {
        var pos = this.space.get_random_position_empty();
        var new_agent = new Susceptible(unique_id, pos, this);

        // register agent
        this.s_list.push(new_agent);
        this.space.add_agent(new_agent, pos);
      }

      //setup infected agents
      for (var u2 of range((unique_id + 1), (unique_id + this.initial_infected))) {
        pos = this.space.get_random_position_empty();
        new_agent = new Infected(u2, pos, this);

        // register agent
        this.i_list.push(new_agent);
        this.space.add_agent(new_agent, pos);
      }
    }


    move_to_r(list_uids, from) {
      var uid;

      for (uid of list_uids) {
        if (from == "s") {
          var agent = this.s_list.filter(function(value, index, arr){ return value.unique_id === uid;})[0];
          // delete
          this.s_list = this.s_list.filter(function(value, index, arr){ return value.unique_id !== uid;});
          // remove agent from world
          this.space.remove_agent(agent);

        } else if (from == "i") {
          var agent = this.i_list.filter(function(value, index, arr){ return value.unique_id === uid;})[0];
          // delete
          this.i_list = this.i_list.filter(function(value, index, arr){ return value.unique_id !== uid;});
          // remove agent from world
          this.space.remove_agent(agent);

        } else {
          console.log("Error switching class to Removed")
        }

        // add new
        var new_agent = new Removed(agent.unique_id, agent.position, this, 
          agent.now_in_center, agent.last_pos);
        
        new_agent.has_infected = agent.has_infected;

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
        
        new_agent.has_infected = agent.has_infected;

        this.i_list.push(new_agent);        
        this.space.add_agent(new_agent, new_agent.position);
      }
    }


    step_s(){
      var to_r = [];
      var to_i = [];

      // iterate over every agent in s_list - apply step
      for (var key in this.s_list) {
        var [add_r, add_i] = this.s_list[key].step(); // if class change -> no move
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
      return this.i_list.length
    }

      
    step_r() {

      // iterate over every agent in s_list - apply step
      for (var key in this.r_list) {
        this.r_list[key].step();
      }

      // return for statistics
      return this.r_list.length
    }

    
    calculate_R0(count_susceptible, count_infected, count_removed) {
      // Todo: Basic reproduction number implementieren - https://web.stanford.edu/~jhj1/teachingdocs/Jones-Epidemics050308.pdf, https://wwwnc.cdc.gov/eid/article/25/1/17-1901_article
      // R0 = βN / ν : β effective contact rate, ν removal rate; dr/dt = νi ; i = I/N, ds/dt = −βsi - https://en.wikipedia.org/wiki/Compartmental_models_in_epidemiology   

      var dIdt = (6 * count_infected - this.old_I.slice(-3)[0] - 2 * this.old_I.slice(-3)[1] - 3 * this.old_I.slice(-3)[2]) / 6; // average over last 3
      var dRdt = (6 * count_removed - this.old_R.slice(-3)[0] - 2 * this.old_R.slice(-3)[1] - 3 * this.old_R.slice(-3)[2]) / 6; // average
      console.log("dRdT:"+dRdt+"; dIdT:"+ dIdt);
      var gamma = (dRdt + 0.01)/count_infected;

      this.old_R.push(count_removed);
      this.old_S.push(count_susceptible);
      this.old_I.push(count_infected);

      return (( (dIdt + 0.01) /(gamma*count_infected) + 1) * this.population / count_susceptible)
    }


    calculate_mode() {
      var daily_step = this.step_num % this.steps_each_day;
      var mode;
      if (daily_step <= this.schedule["night"]) {
        mode = "night"
      } else if (daily_step > this.schedule["night"] && daily_step <= this.schedule["morning"]) {
        mode = "morning"
      } else if (daily_step > this.schedule["morning"] && daily_step <= this.schedule["work"]) {
        mode = "work"
      } else if (daily_step > this.schedule["work"] && daily_step <= this.schedule["afterwork"]) {
        mode = "afterwork"
      } else if (daily_step > this.schedule["afterwork"] && daily_step <= this.schedule["evening"]) {
        mode = "evening"
      }

      return mode;
    }


    step() {
      this.space.update_linked_cell(this.repulsion_range);

      // get mode of current step
      this.current_mode = this.calculate_mode();

      // step for each class
      var num_sus = this.step_s()
      var num_inf = this.step_i()
      var num_rem = this.step_r()
      
      /*
      console.log("Susceptible:" + num_sus[0]);
      console.log("Susceptible with Infection:" + num_sus[1]);
      console.log("Identified Infected:" + num_inf);
      console.log("Removed - Recovered:" + num_rem);
      
      var curr_R0 = this.calculate_R0(num_sus[0], (num_inf + num_sus[1]), num_rem);
      this.R_array.push(curr_R0);
      console.log("Basic Reproduction Number (current):" + curr_R0);
      var R0_mean = this.R_array.slice(-10).reduce(function(pv, cv) { return pv + cv; }, 0) / this.R_array.slice(-10).length;
      console.log("Basic Reproduction Number (mean, last 10):" + R0_mean);
      */

      console.log("Day: "+ this.day);
      console.log("Mode: "+ this.current_mode);
      console.log("Step - day-cycle: "+ this.step_num % this.steps_each_day);

      // update step count and day
      this.step_num += 1;
      this.day = Math.floor(this.step_num / this.steps_each_day);

      if (num_inf + num_sus[1] == 0) {
        return true;
      } else {
        return false;
      }
    }

    // remove sleep - regelmäßiges aufrufen - step methoden bei aufruf
    // depricated: run via App.js
    async run() {
      this.reset()
      this.initialize()
      for (var i of range(1, this.max_step)) {
        console.log("Step: "+i);
        
         var ret = this.step()
         if (ret) {
          console.log("Reached end of Simulation after "+i+"steps.");
          break
         }

        await Sleep(200);
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