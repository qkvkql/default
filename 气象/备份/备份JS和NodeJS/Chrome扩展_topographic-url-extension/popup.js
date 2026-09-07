const button = document.getElementById("copyButton");
const status = document.getElementById("status");

const setStatus = (message, type) => {
  status.textContent = message;
  status.className = type;
};

const DECIMAL_NUMBER = "[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)";
const DECIMAL_COORD_PATTERN = new RegExp(
  `([NSWE])?\\s*(${DECIMAL_NUMBER})\\s*(?:\\u00b0|deg(?:rees?)?)?\\s*([NSWE])?`,
  "gi"
);
const DMS_COORD_PATTERN = new RegExp(
  `([NSWE])?\\s*(\\d{1,3})\\s*(?:\\u00b0|deg(?:rees?)?)\\s*(\\d{1,2})?\\s*(?:'|\\u2032|min(?:utes?)?)?\\s*(${DECIMAL_NUMBER})?\\s*(?:"|\\u2033|sec(?:onds?)?)?\\s*([NSWE])?`,
  "gi"
);

const normalizeCoordinateText = (text) =>
  text
    .replace(/\u2212/g, "-")
    .replace(/[\uFF0C\u3001]/g, ",")
    .replace(/\b(long)\b/gi, "longitude");

const applyDirection = (value, direction) => {
  const upperDirection = direction?.toUpperCase();

  if (upperDirection === "S" || upperDirection === "W") {
    return -Math.abs(value);
  }

  if (upperDirection === "N" || upperDirection === "E") {
    return Math.abs(value);
  }

  return value;
};

const decimalString = (value) => {
  if (Object.is(value, -0)) {
    return "0";
  }

  return String(value);
};

const isLatitude = (value) => value >= -90 && value <= 90;
const isLongitude = (value) => value >= -180 && value <= 180;

const isPairInRange = ([latitude, longitude]) =>
  isLatitude(latitude.value) && isLongitude(longitude.value);

const assignRoles = (coordinates) => {
  const latitude = coordinates.find((coordinate) => coordinate.role === "lat");
  const longitude = coordinates.find((coordinate) => coordinate.role === "lon");

  if (latitude && longitude) {
    return [latitude, longitude];
  }

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const pair = [coordinates[index], coordinates[index + 1]];

    if (isPairInRange(pair)) {
      return pair;
    }
  }

  return null;
};

const collectDecimalCoordinates = (text) => {
  const coordinates = [];
  let match;

  while ((match = DECIMAL_COORD_PATTERN.exec(text)) !== null) {
    const direction = (match[1] || match[3] || "").toUpperCase();
    const value = applyDirection(Number(match[2]), direction);
    let role = null;

    if (direction === "N" || direction === "S") {
      role = "lat";
    } else if (direction === "E" || direction === "W") {
      role = "lon";
    }

    coordinates.push({
      value,
      role,
      text: decimalString(value)
    });
  }

  return coordinates;
};

const collectDmsCoordinates = (text) => {
  const coordinates = [];
  let match;

  while ((match = DMS_COORD_PATTERN.exec(text)) !== null) {
    const direction = (match[1] || match[5] || "").toUpperCase();

    if (!direction && !match[3] && !match[4]) {
      continue;
    }

    const degrees = Number(match[2]);
    const minutes = Number(match[3] || 0);
    const seconds = Number(match[4] || 0);

    if (minutes >= 60 || seconds >= 60) {
      continue;
    }

    const unsignedValue = degrees + minutes / 60 + seconds / 3600;
    const value = applyDirection(unsignedValue, direction);
    let role = null;

    if (direction === "N" || direction === "S") {
      role = "lat";
    } else if (direction === "E" || direction === "W") {
      role = "lon";
    }

    coordinates.push({
      value,
      role,
      text: decimalString(value)
    });
  }

  return coordinates;
};

const findCoordinates = (text) => {
  const normalized = normalizeCoordinateText(text).trim();
  if (!normalized) {
    return null;
  }

  const labeledPattern =
    new RegExp(
      `lat(?:itude)?\\s*[:=]?\\s*(${DECIMAL_NUMBER})\\s*(?:\\u00b0|deg(?:rees?)?)?\\D+lon(?:gitude)?\\s*[:=]?\\s*(${DECIMAL_NUMBER})`,
      "i"
    );
  const labeledMatch = normalized.match(labeledPattern);

  if (labeledMatch) {
    const latitude = Number(labeledMatch[1]);
    const longitude = Number(labeledMatch[2]);

    if (isLatitude(latitude) && isLongitude(longitude)) {
      return {
        latitude: decimalString(latitude),
        longitude: decimalString(longitude)
      };
    }
  }

  const dmsPair = assignRoles(collectDmsCoordinates(normalized));

  if (dmsPair) {
    return {
      latitude: dmsPair[0].text,
      longitude: dmsPair[1].text
    };
  }

  const decimalPair = assignRoles(collectDecimalCoordinates(normalized));

  if (!decimalPair) {
    return null;
  }

  const latitude = decimalPair[0].value;
  const longitude = decimalPair[1].value;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !isPairInRange(decimalPair)
  ) {
    return null;
  }

  return {
    latitude: decimalPair[0].text,
    longitude: decimalPair[1].text
  };
};

button.addEventListener("click", async () => {
  button.disabled = true;
  setStatus("Reading clipboard...", "");

  try {
    const clipboardText = await navigator.clipboard.readText();
    const coordinates = findCoordinates(clipboardText);

    if (!coordinates) {
      setStatus("Clipboard does not contain valid latitude and longitude text.", "error");
      return;
    }

    const url =
      `https://en-au.topographic-map.com/world/?center=${coordinates.latitude}%2C${coordinates.longitude}&zoom=13&base=6`;

    await navigator.clipboard.writeText(url);
    setStatus(`Copied: ${url}`, "ok");
  } catch (error) {
    setStatus(`Clipboard access failed: ${error.message}`, "error");
  } finally {
    button.disabled = false;
  }
});
