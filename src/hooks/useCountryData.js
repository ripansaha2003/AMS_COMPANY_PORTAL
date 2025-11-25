import { useState, useEffect, useCallback } from "react";
import { Country, State, City } from "country-state-city";

const formatPhoneCode = (code = "") => {
  const sanitized = code.toString().trim().replace(/^\+/, "");
  return sanitized ? `+${sanitized}` : "+1";
};


export const useCountryData = () => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const formattedCountries = Country.getAllCountries()
      .map((country) => ({
        name: country.name,
        iso2: country.isoCode,
        phoneCode: formatPhoneCode(country.phonecode),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setCountries(formattedCountries);
  }, []);

  const loadStates = useCallback((countryIso2) => {
    setLoading(true);
    try {
      if (!countryIso2) {
        setStates([]);
        return [];
      }

      const normalizedStates = State.getStatesOfCountry(countryIso2)
        .map((item) => ({
          name: item.name,
          iso2: item.isoCode,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setStates(normalizedStates);
      return normalizedStates;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCities = useCallback((countryIso2, stateIso2) => {
    setLoading(true);
    try {
      if (!countryIso2 || !stateIso2) {
        setCities([]);
        return [];
      }

      const normalizedCities = City.getCitiesOfState(countryIso2, stateIso2)
        .map((item) => item.name)
        .sort((a, b) => a.localeCompare(b));

      setCities(normalizedCities);
      return normalizedCities;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCountryByIso2 = useCallback(
    (iso2) => countries.find((country) => country.iso2 === iso2),
    [countries]
  );

  const getCountryByName = useCallback(
    (name) => countries.find((country) => country.name === name),
    [countries]
  );

  const getPhoneCode = useCallback(
    (identifier) => {
      if (!identifier) return "+1";
      const normalized = identifier.toUpperCase?.() || identifier;
      const country =
        countries.find((c) => c.iso2 === normalized) ||
        countries.find((c) => c.name === identifier);
      return country?.phoneCode || "+1";
    },
    [countries]
  );

  const resolveCountryIso2 = useCallback(
    (identifier) => {
      if (!identifier) return "";
      const trimmed = identifier.trim();
      if (trimmed.length === 2 && trimmed.toUpperCase() === trimmed) {
        return trimmed;
      }
      const match =
        countries.find(
          (country) => country.name.toLowerCase() === trimmed.toLowerCase()
        ) || countries.find((country) => country.iso2 === trimmed.toUpperCase());
      return match?.iso2 || "";
    },
    [countries]
  );

  const resolveStateIso2 = useCallback((countryIso2, identifier) => {
    if (!countryIso2 || !identifier) return "";
    const trimmed = identifier.trim();
    if (trimmed.length === 2 && trimmed.toUpperCase() === trimmed) {
      return trimmed;
    }
    const stateList = State.getStatesOfCountry(countryIso2);
    const match = stateList.find(
      (state) => state.name.toLowerCase() === trimmed.toLowerCase()
    );
    return match?.isoCode || "";
  }, []);

  const fetchStates = useCallback(
    (identifier) => {
      const iso2 = resolveCountryIso2(identifier);
      return loadStates(iso2);
    },
    [resolveCountryIso2, loadStates]
  );

  const fetchCities = useCallback(
    (countryIdentifier, stateIdentifier) => {
      const countryIso2 = resolveCountryIso2(countryIdentifier);
      const stateIso2 = resolveStateIso2(countryIso2, stateIdentifier);
      return loadCities(countryIso2, stateIso2);
    },
    [resolveCountryIso2, resolveStateIso2, loadCities]
  );

  return {
    countries,
    states,
    cities,
    loading,
    loadStates,
    loadCities,
    fetchStates,
    fetchCities,
    getCountryByIso2,
    getCountryByName,
    getPhoneCode,
  };
};
