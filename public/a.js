$.getJSON("udata", function(data){
  if (data.displayName === undefined){
    window.location.replace('auth/google');
  }; 
});
