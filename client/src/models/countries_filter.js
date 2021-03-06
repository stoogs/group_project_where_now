const PubSub = require('../helpers/pub_sub.js');

const CountriesFilter = function() {
  this.countriesDetails = null;
  this.sortedFormValues = null;
  this.filteredCountries = null;
}

CountriesFilter.prototype.bindEvents = function() {
  PubSub.subscribe('FormView:form-submitted', (event) => {

    const sortedValues = this.sortFormValues(event.detail);
    console.log(sortedValues);
    this.sortedFormValues = sortedValues;
    const filteredByQualityOfLife = this.filteredByQualityOfLife(this.countriesDetails);
    const maxMinValues = this.getMaxMin(filteredByQualityOfLife, sortedValues);
    const filteredByPreferences = this.filterCountriesByPrefences(filteredByQualityOfLife, sortedValues);
    const transformedValues = this.transformDataIntoPercentages(filteredByPreferences, sortedValues, maxMinValues);
    console.log(transformedValues);
    //transform data

    PubSub.publish('CountriesFilter:Form-result-calculated', filteredByPreferences);
  })

  PubSub.subscribe('CountriesProperties:countries-properties-ready', (event) => {
    // console.log(event.detail);
    this.countriesDetails = event.detail;

  })
}


CountriesFilter.prototype.sortFormValues = function(valuesToSort) {
  const sortedValues = valuesToSort.sort( (a, b) => {
    return b.value - a.value;
  })
  return sortedValues;
}


CountriesFilter.prototype.filteredByQualityOfLife = function(countriesToSort) {
  // console.log("countries to sort in filter quality", countriesToSort);
  let validCountries = this.filterInvalidCountries(countriesToSort, "quality_of_life_index");
  // console.log("valid countries in filter quality", validCountries);
  const sortedCountries = validCountries.sort((a, b) => {
    return b.details["quality_of_life_index"] - a.details["quality_of_life_index"];
  })
  return sortedCountries;
}

CountriesFilter.prototype.filterInvalidCountries = function(countries, attribute) {
  // console.log("countries in filterInvalid", countries);
  let validCountries = [];
  countries.forEach((country) => {
    // console.log("country in the forloop", country);
    const detailsKeys = Object.keys(country.details);

    if(detailsKeys.includes(attribute) === true) {
      validCountries.push(country);
    }
  })

  return validCountries;
}


CountriesFilter.prototype.filterCountriesByPrefences = function(countriesToSort, attributes) {
  let filteredCountries = [];
  let counter = 0;
  while (counter < attributes.length){
    if(countriesToSort.length < 10){
      const countriesToDisplay = this.filteredCountries.slice(0, 5);
      return countriesToDisplay;
    }else {

      let attributeToSortBy = attributes[0].attribute;
      let validCountries = this.filterInvalidCountries(countriesToSort, attributeToSortBy);
      let countriesSorted = null;
      if(attributeToSortBy === "health_care_index") {
        countriesSorted = validCountries.sort((a, b) => {
          counter += 1;
          console.log('counter');
          return b.details[`${attributeToSortBy}`] - a.details[`${attributeToSortBy}`];
        })
      } else {
        countriesSorted = validCountries.sort((a, b) => {
          counter += 1;
          console.log('counter');
          return a.details[`${attributeToSortBy}`] - b.details[`${attributeToSortBy}`];
        })
      }

      filteredCountries = this.halfDataSet(countriesSorted);
      console.log("SHIFTED");
      this.filteredCountries = filteredCountries;
      return this.filterCountriesByPrefences(filteredCountries, attributes);
    }

  }
  }


  // return this.filteredCountries;



CountriesFilter.prototype.getMaxMin = function(countriesToSort, attributes) {

  const attributesArray = attributes.map(function(attribute) {
    return attribute.attribute;
  });

  let maxMinForAttribute = null;
  let countryAttributes = {}
  attributesArray.forEach((attribute) => {
    const attributeObject = {};
    maxMinForAttribute = countriesToSort.map((country) => {
      // console.log(`attribute for ${attribute}`, maxMinForAttribute);
      return country.details[attribute];
    })

    const attributeMaxMinValues = {}
    const max = Math.max(...maxMinForAttribute);
    console.log("max", max);
    const min = Math.min(...maxMinForAttribute);
    console.log("min", min);
    attributeMaxMinValues['max'] = max;
    attributeMaxMinValues['min'] = min;

    attributeObject['attributeName'] = attribute;
    attributeObject['attributeValues'] = attributeMaxMinValues;
    console.log(attributeObject);
    countryAttributes[attribute] = attributeObject;
  })
  return countryAttributes;
}

CountriesFilter.prototype.transformDataIntoPercentages = function(countries, attributes, maxMinValues) {
  console.log("maxMinValues", maxMinValues);

  countries.forEach((country) => {
    const attributesArray = attributes.map(function(attribute) {
      return attribute.attribute;
    });
    console.log(attributesArray);
    let percentages = {};
    // attributesArray.forEach((attributeName) => {
    attributesArray.forEach((attribute) => {
      const currentAttribute = attribute;
      console.log(currentAttribute);
      const indexValueForCountry = country.details[currentAttribute];
      const maxValueForIndex = maxMinValues[currentAttribute].attributeValues.max;
      const minValueForIndex = maxMinValues[currentAttribute].attributeValues.min;
      const spectrum = maxValueForIndex - minValueForIndex;
      const result = ((indexValueForCountry - minValueForIndex) / spectrum) * 100;
      const resultRoundedDown = Math.floor(result);
      percentages[currentAttribute] = resultRoundedDown;
    })



    country['percentageValues'] = percentages;

  })
  console.log(countries);
  return countries;
}

CountriesFilter.prototype.halfDataSet = function(dataToHalf) {
  const halfLengthRoundedDown = Math.floor(dataToHalf.length/2);
  const newDataSet = dataToHalf.slice(0, halfLengthRoundedDown);
  return newDataSet;
}



module.exports = CountriesFilter;
