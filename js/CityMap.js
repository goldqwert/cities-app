class CityMap {
    constructor(cityList) {
        this.cityList = this.getInitialData(cityList)
    }
    // - add a possibility to save the list of cities in a localStorage and pull it in common list
    // automatically after page reload
    getInitialData(data) {
        const storageData = localStorage.getItem('cityList');
        return JSON.parse(storageData) || data.split(';').map(el => {
            return {
                name: el.split(',')[0].trim(),
                abbreviation: el.split(',')[1].trim(),
                latitude: parseFloat(el.split(',')[2].trim()),
                longitude: parseFloat(el.split(',')[3].trim()),
                population: parseFloat(el.split(',')[4].trim())
            }
        })
    }
    // 1) Return the name of the northernmost, easternmost, 
    // southernmost or westernmost city from the list, as 
    // requested by the caller.
    calculateCityByPosition(position) {
        if (this.cityList && this.cityList.length) {
            switch (position) {
                case 'northernmost':
                    return this.cityList.reduce((acc, el) => acc.latitude > el.latitude ? acc : el).name
                case 'southernmost':
                    return this.cityList.reduce((acc, el) => acc.latitude < el.latitude ? acc : el).name
                case 'westernmost':
                    return this.cityList.reduce((acc, el) => acc.longitude < el.longitude ? acc : el).name
                case 'easternmost':
                    return this.cityList.reduce((acc, el) => acc.longitude > el.longitude ? acc : el).name
                default:
                    return 'You passed an unknown value'
            }
        }
        return 'not found'
    }
    showCityPosition(position) {
        return `The ${position} is ${this.calculateCityByPosition(position)}`
    }
    // 2) Pass longitude and latitude as parameters, 
    // and return the name of the city that is closest to that location
    showNearestCity(latPoint, longPoint) {
        let nearestCityName = '';
        let minPath = null;

        if (this.cityList && this.cityList.length) {

            this.cityList.forEach(({ name, longitude, latitude }) => {
                // формула для вычисления расстояния между двумя точками AB = √AC2 + BC2.
                const distance = Math.sqrt(Math.pow(latPoint - latitude, 2) + Math.pow(longPoint - longitude, 2));

                if (!minPath || distance < minPath) {
                    minPath = distance;
                    nearestCityName = name;
                }
            });
            return nearestCityName;
        }
        return 'not found'
    }
    // 3) Return a single string containing just the state 
    // abbreviations from the list of cities, each separated by a space.
    // The method should eliminate duplicate states.
    // The result string should not have leading or trailing spaces.
    showStateAbbreviations() {
        const listOfStates = [];
        if (this.cityList && this.cityList.length) {
            this.cityList.forEach(({ abbreviation }) => {
                listOfStates.push(abbreviation);
            });
            const abbreviations = [...new Set(listOfStates)].join(' ').trim();
            return `Cities abbreviation is ${abbreviations}`
        }
        return 'not found'
    }

    // Advanced tasks:
    // - add an ability to search by states (show list of cities of the state) and create a tool to add cities with coordinates and states manually on the UI
    createTable(filteredCities) {
        const table = document.getElementById('table').getElementsByTagName('tbody')[0];
        filteredCities.forEach(el => {
            const newRow = table.insertRow()
            Object.values(el).forEach(val => {
                const newCell = newRow.insertCell()
                const text = document.createTextNode(val)
                newCell.appendChild(text);
            })
        })
    }

    renderTable(searchCriteria = 'name') {
        const searchInput = document.getElementById('search-input')
        let filteredCities = this.cityList;
        searchInput.addEventListener('keyup', el => {
            filteredCities = this.cityList.filter(el => String(el[searchCriteria]).toLowerCase().includes(String(searchInput.value).toLowerCase()))
            this.recreateTable()
            this.createTable(filteredCities)
        })
        this.createTable(filteredCities)
    }

    addNewCity() {
        const name = document.getElementsByClassName('add-city')[0].value;
        const abbreviation = document.getElementsByClassName('add-abbreviation')[0].value;
        const latitude = document.getElementsByClassName('add-latitude')[0].value;
        const longitude = document.getElementsByClassName('add-longitude')[0].value;
        if (name && abbreviation && latitude && longitude) {
            this.cityList = [...this.cityList, {
                name,
                abbreviation,
                latitude,
                longitude
            }]
            this.recreateTable()
            this.renderTable()
        }
    }

    recreateTable() {
        document.querySelector('tbody').remove();
        const tbody = document.createElement('tbody');
        const table = document.getElementById('table');
        table.appendChild(tbody);
    }

    saveCities() {
        localStorage.setItem('cityList', JSON.stringify(this.cityList));
    }

    initChart() {
        const width = 400,
            height = 400,
            margin = 20
        // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
        const radius = Math.min(width, height) / 2 - margin
        // append the svg object to the div called 'my_dataviz'
        const svg = d3.select("#donut")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
        // set the color scale
        const color = d3.scaleOrdinal()
            .domain(this.cityList)
            .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#dc3545", "#ffc107"])
        // Compute the position of each group on the pie:
        const pie = d3.pie()
            .value(d => d.population)
        const data_ready = pie(this.cityList)
        // Now I know that group A goes from 0 degrees to x degrees and so on.
        // shape helper to build arcs:
        const arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius(radius)
        // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
        svg
            .selectAll('mySlices')
            .data(data_ready)
            .enter()
            .append('path')
            .attr('d', arcGenerator)
            .attr('fill', d => color(d.data.population))
            .attr("stroke", "black")
            .style("stroke-width", "2px")
            .style("opacity", 0.7)
        // Now add the annotation. Use the centroid method to get the best coordinates
        svg
            .selectAll('mySlices')
            .data(data_ready)
            .enter()
            .append('text')
            .text(d => d.data.population)
            .attr("transform", (d) => "translate(" + arcGenerator.centroid(d) + ")")
            .style("text-anchor", "middle")
            .style("font-size", 17)
    }

    init() {
        const addCityBtn = document.getElementsByClassName('add-city-button')[0];
        addCityBtn.addEventListener('click', this.addNewCity.bind(this))
        const saveCities = document.getElementsByClassName('save-cities')[0];
        saveCities.addEventListener('click', this.saveCities.bind(this))
        // 1 task
        console.log(this.showCityPosition('northernmost'));
        console.log(this.showCityPosition('southernmost'));
        console.log(this.showCityPosition('westernmost'));
        console.log(this.showCityPosition('easternmost'));
        // 2 task
        console.log(`Nearest city name is ${this.showNearestCity(35, -90)}`);
        // 3 task
        console.log(this.showStateAbbreviations());
        this.renderTable();
        this.initChart()
    }

}

const cities = new CityMap('Nashville, TN, 36.17, -86.78, 671374;New York, NY, 40.71, -74.00, 950443;Atlanta, GA, 33.75, -84.39, 540443;Denver, CO, 39.74, -104.98, 335343;Seattle, WA, 47.61, -122.33, 320567;Los Angeles, CA, 34.05, -118.24, 870432;Memphis, TN, 35.15, -90.05, 478930')

cities.init()