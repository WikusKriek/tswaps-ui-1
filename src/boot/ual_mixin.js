import { UAL } from "universal-authenticator-library";
import { KeycatAuthenticator } from "@telosnetwork/ual-telos-keycat";
import { Scatter } from "ual-scatter";
import { Wombat } from "ual-wombat";
import { Sqrl } from "@smontero/ual-sqrl";
import { Anchor } from "ual-anchor";
import {Wax} from "@eosdacio/ual-wax";
import Vue from "vue";

export default {
  methods: {
    async setUAL() {
      if (localStorage.getItem("selectedChain") != null) {
        await this.$store.dispatch("blockchains/updateCurrentChain", localStorage.getItem("selectedChain"))
      } else {
        await this.$store.dispatch("blockchains/updateCurrentChain", "TELOS")
      }
      let getCurrentChain = this.$store.getters['blockchains/getCurrentChain'];
      const chain = {
        chainId: getCurrentChain.NETWORK_CHAIN_ID,
        rpcEndpoints: [
          {
            protocol: getCurrentChain.NETWORK_PROTOCOL,
            host: getCurrentChain.NETWORK_HOST,
            port: getCurrentChain.NETWORK_PORT
          }
        ]
      };
    
      let authenticators = []
    
      // if telos network, include 'telos sign' as login option
      if (getCurrentChain.NETWORK_NAME === 'TELOS') {
        authenticators = authenticators.concat([new KeycatAuthenticator([chain], { appName: process.env.APP_NAME })])
      }
    
      // if wax network, include 'wax cloud wallet' as login option
      if (getCurrentChain.NETWORK_NAME === 'WAX') {
        authenticators = authenticators.concat([new Wax([chain], { appName: process.env.APP_NAME })])
      }
    
      authenticators = authenticators.concat([
        new Sqrl([chain], { appName: process.env.APP_NAME }),
        new Anchor([chain], { appName: process.env.APP_NAME }),
        new Wombat([chain], { appName: process.env.APP_NAME }),
        new Scatter([chain], { appName: process.env.APP_NAME })
      ]);
    
      const ual = new UAL([chain], "ual", authenticators);
      this.$store["$ual"] = ual;
      Vue.prototype.$ual = ual;
    }
  },
  
};
