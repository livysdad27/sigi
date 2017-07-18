var userProf;
$.getJSON("udata", function(data){
  if (data.displayName === undefined){
    window.location.replace('/auth/google');
  } else {
    window.userProf = data; 
    document.body.style.display = 'block';
  };
});
