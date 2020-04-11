import * as PIXI from "pixi.js";
import React, { useRef, useState, useEffect } from "react";
import BunnyImage from "./bunny.png";
import { GlowFilter } from "@pixi/filter-glow";

const agents = {};
let susceptibleTex;
let infectedTex;
let infectedUnrecognizedTex;
let recoveredTex;
let app;

let elapsedTime = 0.0;

let renderIds = false;

let tickerFunc;

const PixiRenderer = React.memo(
  ({
    worldState,
    worldWidth,
    worldHeight,
    renderWidth,
    renderHeight,
    stepDuration,
  }) => {
    const stageContainer = useRef(null);

    Object.keys(agents).forEach((unique_id) => {
      let index = worldState.agentList.findIndex((agent) => {
        return agent.unique_id == unique_id;
      });
      if (index === -1) {
        app.stage.removeChild(agents[unique_id].sprite);
        if (renderIds) {
          app.stage.removeChild(agents[unique_id].text);
        }
        delete agents[unique_id];
      } else {
        agents[unique_id].oldPos = agents[unique_id].agent.position;
        agents[unique_id].oldState = agents[unique_id].agent.state;

        agents[unique_id].agent = worldState.agentList[index];
      }
    });

    if (app && worldState) {
      worldState.agentList.forEach((agent) => {
        let sprite;
        let text;
        if (agent.unique_id in agents) {
          sprite = agents[agent.unique_id].sprite;
          if (renderIds) {
            text = agents[agent.unique_id].text;
          }
        } else {
          sprite = new PIXI.Sprite(susceptibleTex);

          sprite.width = renderWidth / worldWidth;
          sprite.height = renderHeight / worldHeight;
          app.stage.addChild(sprite);
          if (renderIds) {
            text = new PIXI.Text(agent.unique_id.toString(), {
              fontFamily: "Arial",
              fontSize: 10,
              fill: 0x5555ff,
              align: "center",
            });
            app.stage.addChild(text);
          }

          agents[agent.unique_id] = {
            text: text,
            sprite: sprite,
            agent: agent,
            oldPos: agent.position,
            oldState: agent.state,
          };
        }
        if (agent.state == "infected") {
          sprite.texture = infectedTex;
          if (agents[agent.unique_id].oldState === "infected_unrecognized") {
            sprite.filters = [
              new GlowFilter({
                distance: 15,
                outerStrength: 2,
                color: 0xff0000,
              }),
            ];
          } else {
            sprite.filters = [];
          }
        } else if (agent.state == "infected_unrecognized") {
          sprite.texture = infectedUnrecognizedTex;
        } else if (agent.state == "recovered") {
          sprite.texture = recoveredTex;
        } else if (agent.state == "susceptible") {
          sprite.texture = susceptibleTex;
        }
      });
    }

    // if (gameState.status === "running") {
    //   app.loader.reset();
    //   app.loader.add("bunny", BunnyImage).load((loader, resources) => {
    //       console.log(resources)
    //     // This creates a texture from a 'bunny.png' image
    //     const bunny = new PIXI.Sprite(resources.bunny.texture);

    //     // Setup the position of the bunny
    //     bunny.x = app.renderer.width / 2;
    //     bunny.y = app.renderer.height / 2;

    //     console.log(bunny.y)
    //     // Rotate around the center
    //     bunny.anchor.x = 0.5;
    //     bunny.anchor.y = 0.5;

    //     // Add the bunny to the scene we are building
    //     app.stage.addChild(bunny);

    //     // Listen for frame updates
    //     app.ticker.add(() => {
    //       // each frame we spin the bunny around a bit
    //       bunny.rotation += 0.01;
    //     });
    //   });
    // }

   

    useEffect(() => {
      if (
        !worldHeight ||
        !worldWidth ||
        !stepDuration ||
        isNaN(renderHeight) ||
        isNaN(renderWidth)
      ) {
        return;
      }
      if (!app) {
        app = new PIXI.Application({
          width: renderWidth,
          height: renderHeight,
          transparent: true,
        });

        stageContainer.current.appendChild(app.view);

        let gr = new PIXI.Graphics();
        gr.beginFill(0x000000);
        gr.lineStyle(0);
        gr.drawCircle(
          renderWidth / worldWidth,
          renderHeight / worldHeight,
          Math.min(renderWidth / worldWidth, renderHeight / worldHeight)
        );
        gr.endFill();

        susceptibleTex = app.renderer.generateTexture(gr);

        gr = new PIXI.Graphics();
        gr.beginFill(0xff0000);
        gr.lineStyle(0);
        gr.drawCircle(
          renderWidth / worldWidth,
          renderHeight / worldHeight,
          Math.min(renderWidth / worldWidth, renderHeight / worldHeight)
        );
        gr.endFill();

        infectedTex = app.renderer.generateTexture(gr);

        gr = new PIXI.Graphics();
        gr.beginFill(0x0000ff);
        gr.lineStyle(0);
        gr.drawCircle(
          renderWidth / worldWidth,
          renderHeight / worldHeight,
          Math.min(renderWidth / worldWidth, renderHeight / worldHeight)
        );
        gr.endFill();

        infectedUnrecognizedTex = app.renderer.generateTexture(gr);

        gr = new PIXI.Graphics();
        gr.beginFill(0x00ff00);
        gr.lineStyle(0);
        gr.drawCircle(
          renderWidth / worldWidth,
          renderHeight / worldHeight,
          Math.min(renderWidth / worldWidth, renderHeight / worldHeight)
        );
        gr.endFill();

        recoveredTex = app.renderer.generateTexture(gr);
      }
      app.ticker.remove(tickerFunc);
      tickerFunc = (deltaTime) => {
        elapsedTime += deltaTime / PIXI.settings.TARGET_FPMS / 1000;
        Object.keys(agents).forEach((unique_id) => {
          let agentInfo = agents[unique_id];

          agentInfo.sprite.x =
            agentInfo.oldPos[0] * (renderWidth / worldWidth) +
            (agentInfo.agent.position[0] * (renderWidth / worldWidth) -
              agentInfo.oldPos[0] * (renderWidth / worldWidth)) *
              Math.min(elapsedTime / stepDuration, 1.0);
          agentInfo.sprite.y =
            agentInfo.oldPos[1] * (renderHeight / worldHeight) +
            (agentInfo.agent.position[1] * (renderHeight / worldHeight) -
              agentInfo.oldPos[1] * (renderHeight / worldHeight)) *
              Math.min(elapsedTime / stepDuration, 1.0);

          if (renderIds) {
            agentInfo.text.x = agentInfo.sprite.x;
            agentInfo.text.y = agentInfo.sprite.y + renderHeight / worldHeight;
          }
        });
      };
      app.ticker.add(tickerFunc);
    }, [worldHeight, worldWidth, stepDuration, renderHeight, renderWidth]);


    useEffect(() => {
      if (app && worldState.hotSpots) {
        console.log("Render Hotspots");

        worldState.hotSpots.forEach((hotSpot) => {
          let gr = new PIXI.Graphics();
          gr.beginFill(0x00ffff, 0.2);
          gr.lineStyle(0);
          gr.drawCircle(
            hotSpot.strength * renderWidth,
            hotSpot.strength * renderHeight,
            Math.min(hotSpot.strength * renderWidth, hotSpot.strength * renderHeight)
          );
          gr.endFill();
          let hotSpotTex = app.renderer.generateTexture(gr);
          let hotSpotSprite = new PIXI.Sprite(hotSpotTex);
          hotSpotSprite.x = hotSpot.pos[0] * (renderWidth / worldWidth) - (hotSpot.strength * renderWidth) / 2
          hotSpotSprite.y = hotSpot.pos[1] * (renderHeight / worldHeight) - (hotSpot.strength * renderHeight) / 2
          
          hotSpotSprite.width = hotSpot.strength * renderWidth
          hotSpotSprite.height = hotSpot.strength * renderHeight 
          app.stage.addChild(hotSpotSprite)
        });
      }
    }, [app, worldState.hotSpots]);

    elapsedTime = 0.0;
    return <div ref={stageContainer}></div>;
  }
);

export { PixiRenderer };
