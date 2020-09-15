import React, { useState, useEffect, Fragment } from "react";
import "./App.css";
import MdEditor from "./components/MdEditor";
import Constants from "./constants";
function App() {
  const [markdown, setMarkdown] = useState(``);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState("");

  const [isLoggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [appToken, setAppToken] = useState("");

  useEffect(() => {
    async function start() {
      // first check cookie and get token
      const token = window.localStorage.getItem('appToken'); 
      if (token && token !== "") {
        console.log('logged in', token);
        setLoggedIn(true);
        await load(token);
      }
    }
    start();
  }, []);

  const checkLogin = async function (
    formUser = "",
    formPass = "",
    login = false
  ) {
    const prefix = Constants.REST_ENDPOINT;
    const formData = new URLSearchParams();

    formData.append("username", formUser);
    formData.append("password", formPass);
    if (login) {
      formData.append("login", login);
    }
    try {
      const response = await fetch(prefix + "/inbox.md", {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        body: formData,
      });

      if (response.ok) {
        const results = await response.json();

        console.log(results);
        // TODO: set the cookie with the token

        setAppToken(results.token);
        window.localStorage.setItem('appToken', results.token);
        setLoggedIn(true);
        return results.token;
      } else {
        console.log("Network response was not ok.");
      }
    } catch (error) {
      console.log("Error when parsing means not logged in, " + error);
    }
  };

  const doLogin = async function () {
    console.log(user);
    console.log(password);
    const token = await checkLogin(user, password, true);
    console.log(token);
    await load(token);
  };

  const load = async function (token) {
    let pathname = window.location.pathname;
    console.log(pathname);
    const prefix = Constants.REST_ENDPOINT;
    if (pathname === "/") {
      pathname = "/index.md";
    }
    // const url = `${Constants.REST_ENDPOINT}record/`;
    try {
      const response = await fetch(prefix + pathname, {
        method: "GET", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
          "Content-Type": "application/json",
          "x-app-token": token,
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      });

      if (response.ok) {
        const results = await response.json();

        console.log(results);
        setMarkdown(results.source);
        setPath(pathname.substring(1));

        setLoading(false);
      } else {
        console.log("Network response was not ok.");
      }
    } catch (error) {
      console.error("Error: " + error);
    }
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <Fragment>
          <div>Show File Tree</div>
          {loading ? (
            <span>Loading</span>
          ) : (
            <MdEditor content={markdown} path={path} />
          )}
        </Fragment>
      ) : (
        <Fragment>
          <span>User</span>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <span>Password</span>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={(e) => doLogin()}>Login</button>
        </Fragment>
      )}
    </div>
  );
}

export default App;
