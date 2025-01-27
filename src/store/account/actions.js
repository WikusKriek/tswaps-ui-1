import { Api, JsonRpc } from "eosjs";

export const login = async function(
  { commit, dispatch },
  { idx, account, returnUrl }
) {
  const authenticator = this.$ual.authenticators[idx];
  try {
    commit("setLoadingWallet", authenticator.getStyle().text);
    await authenticator.init();
    if (!account) {
      const requestAccount = await authenticator.shouldRequestAccountName();
      if (requestAccount) {
        await dispatch("fetchAvailableAccounts", idx);
        commit("setRequestAccount", true);
        return;
      }
    }
    const users = await authenticator.login(account);
    if (users.length) {
      const account = users[0];
      const accountName = await account.getAccountName();
      this.$ualUser = account;
      console.log("acc rpc", this.$ualUser.rpc);
      this.$type = "ual";
      commit("setAccountName", accountName);
      localStorage.setItem("autoLogin", authenticator.constructor.name);
      localStorage.setItem("account", accountName);
      localStorage.setItem("returning", true);
      // dispatch("getAccountProfile");
    }
  } catch (e) {
    const error =
      (authenticator.getError() && authenticator.getError().message) ||
      e.message ||
      e.reason;
    commit("general/setErrorMsg", error, { root: true });
    console.log("Login error: ", error);
  } finally {
    commit("setLoadingWallet");
  }
};

export const autoLogin = async function({ dispatch, commit }, returnUrl) {
  const { authenticator, idx } = getAuthenticator(this.$ual);
  if (authenticator) {
    commit("setAutoLogin", true);
    await dispatch("login", {
      idx,
      returnUrl,
      account: localStorage.getItem("account")
    });
    commit("setAutoLogin", false);
  }
};

const getAuthenticator = function(ual, wallet = null) {
  wallet = wallet || localStorage.getItem("autoLogin");
  const idx = ual.authenticators.findIndex(
    auth => auth.constructor.name === wallet
  );
  return {
    authenticator: ual.authenticators[idx],
    idx
  };
};

export const logout = async function({ commit }) {
  const { authenticator } = getAuthenticator(this.$ual);
  try {
    authenticator && (await authenticator.logout());
  } catch (error) {
    console.log("Authenticator logout error", error);
  }
  commit("setProfile", undefined);
  commit("setAccountName");
  this.$type = "";
  localStorage.removeItem("autoLogin");

  if (this.$router.currentRoute.path !== "/") {
    this.$router.push({ path: "/" });
  }
};

export const getUserProfile = async function({ commit }, accountName) {
  try {
    const profileResult = await this.$api.getTableRows({
      code: "profiles",
      scope: "profiles",
      table: "profiles",
      limit: 1,
      index_position: 1,
      key_type: "i64",
      lower_bound: accountName,
      upper_bound: accountName
    });

    const profile = profileResult.rows[0];
    commit("setProfile", profile);
  } catch (error) {
    commit("general/setErrorMsg", error.message || error, { root: true });
  }
};

export const getAccountProfile = async function({ commit, dispatch }) {
  if (!this.state.account.accountName) {
    return;
  }

  dispatch("getUserProfile", this.state.account.accountName);
};

export const accountExists = async function({ commit, dispatch }, accountName) {
  try {
    const account = await this.$api.getAccount(accountName);
    return !!account;
  } catch (e) {
    return false;
  }
};

export const accountExistsOnChain = async function(
  { commit, dispatch, rootGetters },
  payload
) {
  // get current selected chain
  let blockchains = rootGetters["blockchains/getNetworkByName"](
    payload.network.toUpperCase()
  );
  let newChain = {};

  // check if testnet or not
  if (process.env.TESTNET == "true") {
    newChain = blockchains.find(el => el.TEST_NETWORK === true);
  } else {
    newChain = blockchains.find(el => el.TEST_NETWORK === false);
  }
  // console.log(newChain)

  //set rpc
  const rpc = new JsonRpc(
    `${newChain.NETWORK_PROTOCOL}://${newChain.NETWORK_HOST}:${newChain.NETWORK_PORT}`
  );
  //check if account exists on chain
  let exists = await rpc.get_account(payload.account);
  return exists;
};
