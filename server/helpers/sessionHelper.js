export const getIpAddress = (req) => {
  let ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "127.0.0.1";

  // Remove IPv6 prefix if present
  if (ipAddress.includes("::")) {
    ipAddress = ipAddress.replace(/^.*:/, "") || "127.0.0.1";
  }

  // Fallback
  if (ipAddress === "-1" || !ipAddress) {
    ipAddress = "127.0.0.1";
  }

  return ipAddress;
};

export const getDeviceName = (userAgent) => {
  let deviceName = "";
  if (userAgent.includes("Windows NT 10")) deviceName = "Windows 10";
  else if (userAgent.includes("Windows NT 11")) deviceName = "Windows 11";
  else if (userAgent.includes("Windows")) deviceName = "Windows";
  else if (userAgent.includes("Macintosh")) deviceName = "Mac";
  else if (userAgent.includes("iPhone")) deviceName = "iPhone";
  else if (userAgent.includes("iPad")) deviceName = "iPad";
  else if (userAgent.includes("Android")) deviceName = "Android";
  else if (userAgent.includes("Linux")) deviceName = "Linux";
  else deviceName = "Unknown Device";

  let browserInfo = "";
  if (userAgent.includes("Chrome") && !userAgent.includes("Chromium")) {
    const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/);
    browserInfo = chromeMatch ? `Chrome ${chromeMatch[1]}` : "Chrome";
  } else if (userAgent.includes("Firefox")) {
    const firefoxMatch = userAgent.match(/Firefox\/([\d.]+)/);
    browserInfo = firefoxMatch ? `Firefox ${firefoxMatch[1]}` : "Firefox";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    browserInfo = "Safari";
  } else if (userAgent.includes("Edge")) {
    const edgeMatch = userAgent.match(/Edg\/([\d.]+)/);
    browserInfo = edgeMatch ? `Edge ${edgeMatch[1]}` : "Edge";
  }

  return browserInfo ? `${deviceName} - ${browserInfo}` : deviceName;
};

export const createSession = (req, user) => {
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = getIpAddress(req);
  const deviceName = getDeviceName(userAgent);

  const newSession = {
    deviceName,
    userAgent,
    ipAddress,
    lastActive: new Date(),
    isCurrent: true,
    createdAt: new Date(),
  };

  user.sessions = user.sessions || [];

  // Cap sessions at 10
  if (user.sessions.length >= 10) {
    // Sort by lastActive ascending (oldest first) to remove oldest
    user.sessions.sort(
      (a, b) => new Date(a.lastActive) - new Date(b.lastActive)
    );
    // Remove the oldest session
    user.sessions.shift();
  }

  // Mark old sessions as not current
  user.sessions.forEach((session) => {
    session.isCurrent = false;
  });

  user.sessions.push(newSession);

  // Return the created session (it will be the last one)
  return user.sessions[user.sessions.length - 1];
};
