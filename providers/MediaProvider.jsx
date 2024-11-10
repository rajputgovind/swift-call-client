import React, { createContext, useContext, useEffect, useRef }  from 'react'

const MediaContext = createContext();

const MediaProvider = ({children}) => {

 
  const audioStreamRef = useRef(null);
 
  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      audioStreamRef.current = stream;
    } catch (error) {
      console.log(error);
    }
  }


  useEffect(() => {
    if(!audioStreamRef.current){
      console.log("getMedia called",audioStreamRef.current);
      getMedia();
    }
  }, []);

  
  return <MediaContext.Provider value={{audioStreamRef}}>
    {children }
  </MediaContext.Provider>
}

const useMedia = () => {
  return useContext(MediaContext);
}   

export default MediaProvider;
export {useMedia};