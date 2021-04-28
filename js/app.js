var MoonLoader = VueSpinner.MoonLoader


new Vue({
  components: {
    MoonLoader,
  },
  el: '#app',

  data() {
    return {
      color: '#b92e34',
      info: null,
      loadingMundo: false,
      info: [],
      showMap: false,
      maisMortesPais: '',
      maisCasosPais: '',
      showMundo: true,
      showBrasil: false,
      loadingBR: false,
      estadosCovid: [],
      sync:''
    }
  },
  mounted() {
    this.worldDataCovid()
  },

  methods: {
    changeVisualization(param) {
      if(param == 'BR') {
        this.showBrasil = true
        this.showMundo = false
        this.loadDataBrasil();
      }else {
        this.worldDataCovid()
        this.showBrasil = false
        this.showMundo = true
      }
    },

    loadDataBrasil() {
      var currentdate = new Date(); 
      this.sync = "Atualizado em: " + currentdate.getDate() + "/"
                      + (currentdate.getMonth()+1)  + "/" 
                      + currentdate.getFullYear() + " @ "  
                      + currentdate.getHours() + ":"  
                      + currentdate.getMinutes() + ":" 
                      + currentdate.getSeconds();
      this.loadingBR = true;

      const url = 'https://covid19-brazil-api.vercel.app/api/report/v1';

      axios.get(url).then(res => {
        if (res.status === 200) {
          console.log(res.data.data)
          this.estadosCovid = res.data.data
          this.loadingBR = false
        }
      }).catch(err => {
        console.log(err)
        this.loadingMundo = false
      })
    },

    showChart(labels, data) {
        ctx = document.getElementById('myChart').getContext('2d');
        dataValues = {
            labels: labels,
            datasets: [{
                label: 'Mortes',
                data: data,
                backgroundColor: [
                    'rgba(128, 30, 59,0.2)',
                ],
                borderColor: [
                    'rgba(128, 30, 59,0.2)',
                ],
                borderWidth: 1
            }],
        }
        myChart = new Chart(ctx, {
            type: 'line',
            data: dataValues
        });
    },

    worldDataCovid() {
      this.loadingMundo = true;


      const url = 'https://api.covid19api.com/summary';

      axios.get(url).then(res => {
        var arr = res.data.Countries;

        var country = arr.map(item => item.Country.toLowerCase())
        totalDeaths = arr.map(item => item.TotalDeaths);
        totalConfirmed = arr.map(item => item.TotalConfirmed);

        this.info = [country, totalDeaths, totalConfirmed]
        var idxMaisMortesPais = totalDeaths.indexOf(Math.max.apply(null, totalDeaths))
        this.maisMortesPais = [country[idxMaisMortesPais].toUpperCase(), totalDeaths[idxMaisMortesPais]]

        var idxMaisCasos = totalConfirmed.indexOf(Math.max.apply(null, totalConfirmed))
        this.maisCasosPais = [country[idxMaisCasos].toUpperCase(), totalConfirmed[idxMaisCasos]]
        if (res.status === 200) {
          this.loadingMundo = false
          this.showMap = true
          this.generateMap()
        }
      }).catch(err => {
        console.log(err)
        this.loadingMundo = false
      })
    },

    generateMap() {
      am4core.useTheme(am4themes_dataviz);

      var chart = am4core.create("chartdiv", am4maps.MapChart);
      chart.projection = new am4maps.projections.Miller();

      var worldSeries = chart.series.push(new am4maps.MapPolygonSeries());
      worldSeries.useGeodata = true;
      worldSeries.geodata = am4geodata_worldLow;
      worldSeries.exclude = ["AQ"];

      var worldPolygon = worldSeries.mapPolygons.template;
      worldPolygon.tooltipText = "País: {countryName}\nMortes: {mortes}\nTotal casos: {totalCasos}";
      worldPolygon.nonScalingStroke = true;
      worldPolygon.strokeOpacity = 0.5;
      worldPolygon.fill = am4core.color("#eee");
      worldPolygon.propertyFields.fill = "color";

      var hs = worldPolygon.states.create("hover");
      hs.properties.fill = chart.colors.getIndex(9);


      var countrySeries = chart.series.push(new am4maps.MapPolygonSeries());
      countrySeries.useGeodata = true;
      countrySeries.hide();
      countrySeries.geodataSource.events.on("done", function (ev) {
        worldSeries.hide();
        countrySeries.show();
      });

      var countryPolygon = countrySeries.mapPolygons.template;
      countryPolygon.tooltipText = "País: {countryName}\nMortes: {mortes}\nTotal casos: {totalCasos}";
      countryPolygon.nonScalingStroke = true;
      countryPolygon.strokeOpacity = 0.5;
      countryPolygon.fill = am4core.color("#eee");

      var hs = countryPolygon.states.create("hover");
      hs.properties.fill = chart.colors.getIndex(9);

      worldPolygon.events.on("hit", function (ev) {
        ev.target.series.chart.zoomToMapObject(ev.target);
        var map = ev.target.dataItem.dataContext.map;
        if (map) {
          ev.target.isHover = false;
          countrySeries.geodataSource.url = "https://www.amcharts.com/lib/4/geodata/json/" + map + ".json";
          countrySeries.geodataSource.load();
        }
      });

      var data = [];
      for (var id in am4geodata_data_countries2) {
        if (am4geodata_data_countries2.hasOwnProperty(id)) {
          var country = am4geodata_data_countries2[id];
          if (country.maps.length) {
            var totalCasos = 0,
              mortes = 0

            var countryName = country.country.toLowerCase() == 'united states' ?
              'united states of america' : country.country.toLowerCase()
            var countryIndex = this.info[0].indexOf(countryName);
            if (typeof countryIndex != 'undefined' && countryIndex != null) {
              mortes = this.info[1][countryIndex] ? this.info[1][countryIndex] : 0
              totalCasos = this.info[2][countryIndex] ? this.info[2][countryIndex] : 0
            }

            data.push({
              id: id,
              color: mortes.toString().length >= 6 ? chart.colors.getIndex(1) : mortes.toString().length >= 4 ? chart.colors.getIndex(3) : chart.colors.getIndex(6),
              map: country.maps[0],
              countryName: country.country,
              totalCasos: totalCasos,
              mortes: mortes

            });
          }
        }
      }
      worldSeries.data = data;

      chart.zoomControl = new am4maps.ZoomControl();

      var homeButton = new am4core.Button();
      homeButton.events.on("hit", function () {
        worldSeries.show();
        countrySeries.hide();
        chart.goHome();
      });

      homeButton.icon = new am4core.Sprite();
      homeButton.padding(7, 5, 7, 5);
      homeButton.width = 30;
      homeButton.icon.path = "M16,8 L14,8 L14,16 L10,16 L10,10 L6,10 L6,16 L2,16 L2,8 L0,8 L8,0 L16,8 Z M16,8";
      homeButton.marginBottom = 10;
      homeButton.parent = chart.zoomControl;
      homeButton.insertBefore(chart.zoomControl.plusButton);
    }



  },
})