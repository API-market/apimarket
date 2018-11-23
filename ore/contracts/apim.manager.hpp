#pragma once
#include <map>
#include <vector>
#include <algorithm>
#include <string>

#include <../ore.instrument/ore.instrument.hpp>

using namespace eosio;
using namespace std;

class apiregistry : public eosio::contract
{
  public:
    apiregistry(account_name self) : contract(self), _offers_data(_self, _self) {}

    //@abi table offersdata i64
    struct offer_data
    {
        uint64_t id;
        string name;
        vector<ore_types::right_param> rights;

        uint64_t primary_key() const { return id; }

        EOSLIB_SERIALIZE(offer_data, (id)(name)(rights))
    };

    eosio::multi_index<N(offersdata), offer_data> _offers_data;

    //TODO: move the following function to ore_types
    auto find_arg_by_name(vector<ore_types::args> params, string key)
    {
        for (int i = 0; i < params.size(); i++)
        {
            if (params[i].name == key)
            {
                return params[i].value;
            }
        }
    }
    auto find_arg_by_type(vector<ore_types::param_type> params, string key)
    {
        for (int i = 0; i < params.size(); i++)
        {
            if (params[i].type == key)
            {
                return params[i].values;
            }
        }
    }
    //TODO: move the following function to ore_types
    //helper function to find if a value exists in an array of type string
    bool in_array(const string &value, const vector<string> &array)
    {
        return std::find(array.begin(), array.end(), value) != array.end();
    }

    // TODO: remove default values for start_time and end_time
    void publishapi(account_name creator, account_name issuer, string api_voucher_license_price_in_cpu, string api_voucher_lifetime_in_seconds,
                    string api_voucher_start_date, string api_voucher_end_date, uint8_t api_voucher_valid_forever, uint8_t api_voucher_mutability, string api_voucher_security_type,
                    vector<ore_types::offer_params> right_params, vector<ore_types::param_type> api_voucher_parameter_rules,
                    uint8_t offer_mutability, string offer_security_type, string offer_template, uint64_t offer_start_time,
                    uint64_t offer_end_time, uint64_t offer_override_id);

    void licenseapi(account_name creator, account_name buyer, uint64_t offer_id, string offer_template, vector<ore_types::api_voucher_params> api_voucher_additional_url_params, string voucher_encrypted_by = "", uint64_t override_voucher_id = 0);
};