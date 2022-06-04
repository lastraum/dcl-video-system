
export enum VideoSystemTypes{
    LIVE,
    PLAYLIST,
    NONE
}

export type VideoSystemConfig = {
    type:VideoSystemTypes,
    offType:VideoSystemTypes,
    liveLink?:string,
    playList?:string[],
    offImage?:string,
    emission:number,
    volume?:number
    noLoop?:boolean,
    id?: number | string
}

export class VideoSystem{
    timer = 0
    live = false
    playing = false
    started = false
    texture: any
    material: Material
    data:VideoSystemConfig
    playlist?:VideoPlaylist

    constructor(data:VideoSystemConfig){
        this.data = data
        this.texture = new VideoTexture(new VideoClip(""))
        this.material = new Material()
        this.material.albedoColor = Color4.Black()
        this.data.offType == VideoSystemTypes.PLAYLIST ? this.playlist = new VideoPlaylist(this, this.material, this.data.playList, this.data.noLoop ? this.data.noLoop : undefined) : null
    }
    
    update(dt:number){
        if(this.started){
            if(this.timer > 0){
                this.timer -= dt
            }
            else{
                this.timer = 5
                try{
                    fetch(this.data.liveLink!).then((r) => {
                          if(r.status < 400){
                            this.playing = false
                            log("Currently Live.")
                            this.goOnline() 
                        }
                        else{
                         // log('not live')
                          this.goOffline()
                        }
                    })
                }
                catch(e){
                       log("video no live")
                }
            }
        }
    }

    setVolume(vol:number){
        this.data.volume = vol
    }

    startLive(){
        if(this.data.type != VideoSystemTypes.LIVE && !this.started){
            this.data.type = VideoSystemTypes.LIVE
            this.start()
        }
    }
  
    goOnline(){
      if(!this.live){
        //  log("Intializing live screen.")
        log('online')
          this.live = true;
          let liveFeed = new VideoClip(this.data.liveLink!);

          log('live feed is ', + this.data.liveLink!)

          if(this.data.offType == VideoSystemTypes.PLAYLIST){
            if(this.playlist!.playing){
              this.playlist!.reset()
          }
          }

          this.texture.playing = false
          this.texture = new VideoTexture(liveFeed);
          this.texture.playing = true
          this.texture.volume = this.data.volume ? this.data.volume : 1

          this.material.albedoTexture = this.texture;
          this.material.emissiveTexture = this.texture;
          this.material.emissiveIntensity = this.data.emission
          this.material.emissiveColor = Color3.White()
          this.material.roughness = 1
      }   
    }
  
  
    goOffline(){
      if(!this.playing) {
          this.live = false;
          this.playing = true
          this.texture.playing = false

        if(this.data.offType == VideoSystemTypes.PLAYLIST){
            log('video system is offline, we need to play the playlist')
             this.playlist!.start()
        }
        else{
            log('we need to show black screen')
          this.texture = new VideoTexture(new VideoClip(""))
          this.material.albedoTexture = this.texture;
          this.material.emissiveTexture = this.texture;
          this.material.albedoColor = Color4.Black()
        }
          log('offline')
      }
    }

    stop(){
        switch(this.data.type){
            case VideoSystemTypes.LIVE:
              this.texture.playing = false
              this.live = false
              this.playing = false
              this.started = false
              engine.removeSystem(this)
              break;
          }
      
          if(this.playlist){
              this.playlist.stop()
        }
    }

    start(vol?:number){
      log('starting live system')
        this.started = true
        if(vol){
            this.data.volume = vol
        }
        if(this.data.type == VideoSystemTypes.LIVE){
            engine.addSystem(this)
        }
        else{
            log('need to start video playlist system')
            this.playlist!.setVolume(this.data.volume ? this.data.volume : 1)
            this.playlist!.start()
        }
    }

    off(){
        log('we are here, lets turn off')
        this.texture = new VideoTexture(new VideoClip(""))
        this.material.albedoTexture = this.texture
        this.material.emissiveTexture = this.texture
        // if(this.data.offType == Types.IMAGE){
        //     log('need to display an image')
        //     this.material.albedoTexture = new Texture(this.data.offImage ? this.data.offImage : "")
        //     this.material.emissiveTexture = new Texture(this.data.offImage ? this.data.offImage : "")
        // }
    }

    pause(){
        switch(this.data.type){
            case VideoSystemTypes.LIVE:
              this.texture.playing = false
              this.live = false
              this.playing = false
              this.started = false
              engine.removeSystem(this)
              break;
          }

        if(this.data.type == VideoSystemTypes.PLAYLIST || this.data.offType == VideoSystemTypes.PLAYLIST){
            this.playlist!.pause()
        }
    }
  }

  class VideoPlaylist{

    index = -1
    timer = 0
    playing = false
    stopped = false

    parentSystem:VideoSystem
    material: Material
    texture:VideoTexture
    links: any
    exists = false
    volume = 1
    noLoop = false
    

    constructor(system:VideoSystem, mat:Material, links:any, noLoop?:boolean){
        this.parentSystem = system
        this.material = mat
        this.links = links
        this.texture = new VideoTexture(new VideoClip(this.links[0]))
        if(noLoop){
            this.noLoop = noLoop
        }
    }

    update(dt:number){
        if(this.playing){
            if(this.timer > 0){
                this.timer -= dt
            }
            else{            
                log('checking for video')
                this.index++
                
                if(this.noLoop){
                    if(this.index == 0){
                        this.timer = 500
                        this.playVideo(this.index)
                    }
                    else{
                        log('don playing video, switch to off mode')
                        this.stop()
                        this.parentSystem.off()
                    }
                }
                else{
                    if(this.index >= this.links.length){
                        this.index = 0
                    }
                    this.timer = 500
                    this.playVideo(this.index)
                }
            }
        }
    }

    setVolume(vol:number){
        this.volume = vol 
    }

    stop(){
        this.playing = false
        this.texture.playing = false
        engine.removeSystem(this)

        this.parentSystem.off()
        this.stopped = true
    }

    pause(){
        log('pausing playlist')
        this.playing = false
        this.texture.playing = false
        engine.removeSystem(this)
    }

    reset(){
        //this.stop()
        this.timer = 0
        this.index = -1
    }

    start(){
        if(this.stopped){
            this.reset()
            this.stopped = false
        }

        this.playing = true
        this.texture.playing = true
        //this.timer = 0
        engine.addSystem(this)

        onVideoEvent.add((data) => {
            if(data.videoStatus == 4){
                this.timer = data.totalVideoLength
                onVideoEvent.clear()
            }
          })
    }

    playVideo(index: number){
        this.texture.playing = false
        this.texture = new VideoTexture(new VideoClip(this.links[this.index]))
        this.material.albedoTexture = this.texture
        this.material.emissiveTexture = this.texture

        this.material.emissiveIntensity = this.parentSystem.data.emission
        this.material.emissiveColor = Color3.White()
        this.material.roughness = 1
        this.texture.playing = true
        this.texture.volume = this.volume

        onVideoEvent.add((data) => {
            if(data.videoStatus == 4){
                this.timer = data.totalVideoLength
                onVideoEvent.clear()
            }
          })
    }

}