// CUSTOM JS FILE //

function init() {
  renderPeeps();
}

function renderPeeps(){
	jQuery.ajax({
		url : '/api/get',
		dataType : 'json',
		success : function(response) {
			console.log(response);

			var country = response.country;

			for(var i=0;i<country.length;i++){
				var htmlToAdd = '<div class="col-md-4">'+
					'<img src='+country[i].flag+' width="100">'+
					'<h1>'+country[i].country+'</h1>'+
					'<ul>'+
						'<li>Continent: <b>'+country[i].continent+'</b></li>'+
            '<li>Capital City: <b>'+country[i].capitalCity+'</b></li>'+
            '<li>Population: <b>'+country[i].popn+'</b></li>'+
            '<li> Currency: <b>'+country[i].currency+'</b></li>'+
            '<li>Language: <b>'+country[i].language+'</b></li>'+
            '<img src='+country[i].coatOfArm+' width="100">'+
            '<li>Symbolic Animal: <b>'+country[i].animal+'</b></li>'+
            '<li>National Flower or Plant: <b>'+country[i].plant+'</b></li>'+
            '<li>motto: <b>'+country[i].motto+'</b></li>'+
					'</ul>'+
					'<a href="/edit/'+country[i].slug+'">Edit Country Information</a>'+
				'</div>';

				jQuery("#country-holder").append(htmlToAdd);
			}



		}
	})
}

window.addEventListener('load', init())
