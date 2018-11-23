#include <apim.manager.hpp>

using namespace eosio;
using namespace std;

account_name INSTRUMENT_CONTRACT_NAME = N(instr.ore);
account_name RIGHTS_CONTRACT_NAME = N(rights.ore);
account_name TOKEN_CONTRACT_NAME = N(token.ore);

// transaction id for deferred transaction
uint64_t MINT_DEFERRED_TRX_ID = now();

// publishapi - creates an ORE Instrument (an API Offer)
//
// --Input parameters
//
// creator:                         account that has been whitelisted to create an offer
// issuer:                          user account that owns the api (and is publishing it)
// api_voucher_description:         user readable description of the api (will be added to additionalUrlParams for the api offer)
//                                      (e.g. 'Hadron Spacetelescope Access - US West Datacenter')
// api_voucher_license_price_in_cpu
// api_voucher_lifetime_in_seconds: sets apiVoucher's endDate to nn seconds after its startDate
// api_voucher_start_date:          sets apiVoucher's startDate
// api_voucher_end_date:            sets apiVoucher's endDate
// api_voucher_security_type:       'pass', 'ticket', or 'permit'
// api_voucher_mutability:          mutability type (e.g 0 - immutable, 1 - only dates can be changed, 2- anything can be changed)
// api_voucher_parameter_rules:     array of rules for the api voucher
//      [type, - rule type (e.g locked/default/required)
//       name, - parameter name (e.g userAccount)
//       value, - parameter value (e.g 'sdjfchsvbj')
//      ]
// api_voucher_rights:         array api/rights for the destination instrument (the offer being created)
//      [right_name, - global apiName (e.g. io.hadron.spaceTelescope),
//       right_description,
//       right_price_in_cpu, - price (integer)
//       right_payment_model, - (e.g. payPerCall),
//       right_additional_url_params  - name/value array of additional parameters to included in the additionalUrlParams for the api offer (e.g. regionCode:”en_us”, favoriteStarWars: 'EpisodeIV")
//      ]
// offer_mutability:           mutability type (e.g 0 - immutable, 1 - only dates can be changed, 2- anything can be changed)
// offer_security_type:       (optional) 'pass', 'ticket', or 'permit'
// offer_template:             unique name for the offer instrument
// offer_start_time:           Epoch time (optional)
// offer_end_time:             Epoch time (optional)
// offer_override_id           if provided, attempts to create an offer using the id (optional; defaults to next sequential id number)
//
// --Output is an API Offer (an ORE Instrument saved to ORE chain)
//
// class:           'apimarket.offer.licenseApi'
// description:     'Creates an API voucher to access {api_name}'
// security_type:   'pass'  (Future: This should be a parameter that can be passed-in)
// issuer:          {issuer}
// start_time:      defaults to current time
// end_time:        defaults to empty
// [rights]:        an array with only a single entry
//                     name: 'apimarket.manager.licenseApi' (maps to contract address on EOS - manager.apim)
//                     description: ‘Create api voucher’
//                     additionalUrlParams: apiVoucherParams : {...serialized parameters as json string (all those wityh prefix of api_voucher_... }
//                         , apiSecurityType: {api_security_type}, apiStartTime: {start_time}, apiEndTime: {end_time}

void apiregistry::publishapi(account_name creator, account_name issuer, string api_voucher_license_price_in_cpu, string api_voucher_lifetime_in_seconds,
                             string api_voucher_start_date, string api_voucher_end_date, uint8_t api_voucher_valid_forever, uint8_t api_voucher_mutability, string api_voucher_security_type,
                             vector<ore_types::offer_params> right_params, vector<ore_types::param_type> api_voucher_parameter_rules,
                             uint8_t offer_mutability, string offer_security_type, string offer_template, uint64_t offer_start_time,
                             uint64_t offer_end_time, uint64_t offer_override_id)
{
    require_auth(creator); //app.apim

    // Hardcoded offer details
    string class_name = "apimarket.offer.licenseApi";

    string offer_description = "creates api voucher using template : " + offer_template;

    uint64_t parent_instrument_id = 0;

    if (offer_start_time == 0)
    {
        offer_start_time = now();
    }

    // if its immutable and end_time = 0; assert
    // TODO: handle case to allow the creation of an instrument that last forever; no end_time
    // remove the following logic
    if (offer_end_time == 0)
    {
        offer_end_time = offer_start_time + (30 * 24 * 60 * 60);
    }

    vector<ore_types::url_params> all_params;

    // Reach to the rights table and check if theres a right that has the same right name
    rights_registry rights_contract = rights_registry(RIGHTS_CONTRACT_NAME);
    instrument instr_contract = instrument(INSTRUMENT_CONTRACT_NAME);

    vector<ore_types::right> rights;

    ore_types::url_params temp_url;

    ore_types::params temp_params;

    for (int i = 0; i < right_params.size(); i++)
    {
        temp_params.params.push_back({"api_name", right_params[i].api_name});
        temp_params.params.push_back({"api_description", right_params[i].api_description});
        temp_params.params.push_back({"api_price_in_cpu", right_params[i].api_price_in_cpu});
        temp_params.params.push_back({"api_payment_model", right_params[i].api_payment_model});
        temp_params.params.push_back({"api_additional_url_params", right_params[i].api_additional_url_params});

        temp_url.url_params.push_back(temp_params);

        all_params.push_back(temp_url);

        temp_url.url_params.clear();
        temp_params.params.clear();
    }

    vector<ore_types::args> args;

    for (int i = 0; i < 7; i++)
    {
        args.push_back(ore_types::args());
    }
    args[0] = {"api_voucher_license_price_in_cpu", api_voucher_license_price_in_cpu};
    args[1] = {"api_voucher_lifetime_in_seconds", api_voucher_lifetime_in_seconds};
    args[2] = {"api_voucher_start_date", api_voucher_start_date};
    args[3] = {"api_voucher_end_date", api_voucher_end_date};
    args[4] = {"api_voucher_security_type", api_voucher_security_type};
    args[5] = {"api_voucher_mutability", to_string(int8_t(api_voucher_mutability))};
    args[6] = {"api_voucher_valid_forever", to_string(api_voucher_valid_forever)};

    temp_params.params = args;

    all_params[0].url_params.insert(all_params[0].url_params.begin(), temp_params);

    for (int i = 0; i < right_params.size(); i++)
    {
        //check if the api is already registered or not
        rights_registry::right_reg rightresult = rights_contract.find_right_by_name(right_params[i].right_name);

        rights.push_back({right_params[i].right_name, right_params[i].right_description, right_params[i].right_price_in_cpu, all_params[i].url_params});
    }

    // includes data such as considerations for the voucher in future
    auto offer_data = vector<ore_types::args>{};

    // TODO: get offer_encrypted_by as action input
    string offer_encrypted_by = "";

    // Create the offer instrument
    auto new_instrument = instrument::instrument_data{issuer, class_name, offer_description, offer_template, offer_security_type, api_voucher_parameter_rules, rights, parent_instrument_id, offer_data, offer_encrypted_by, offer_mutability};

    // create a deferred transaction object to add instrument to the tokens table
    transaction mint_instrument{};

    if (instr_contract.isToken(offer_override_id))
    {
        // Call Update action to modify a mutable instrument
        mint_instrument.actions.emplace_back(
            eosio::permission_level{creator, N(active)}, INSTRUMENT_CONTRACT_NAME, N(update),
            //Update action parameters
            std::make_tuple(
                creator,
                offer_template,
                new_instrument,
                offer_override_id,
                offer_start_time,
                offer_end_time));
    }
    else
    {

        mint_instrument.actions.emplace_back(
            eosio::permission_level{creator, N(active)}, INSTRUMENT_CONTRACT_NAME, N(mint),
            //Mint action parameters
            std::make_tuple(
                creator,        // account that has auth to mint the new instrument token
                issuer,         // owner of right (aka issuer)
                new_instrument, // new instrument to mint
                offer_start_time,
                offer_end_time,
                offer_override_id // optional instrument id
                ));
    }

    // send deferred transaction
    mint_instrument.send(MINT_DEFERRED_TRX_ID, creator);
}

//
// licenseapi - creates an ORE Instrument (an API Voucher)
//
// --Input parameters
// creator:  Account that has been whitelisted to create a voucher
// buyer:    User account that wants to use the api
// offer_id: Instrument ID for the Offer being exercised
// offer_template: Instrument template for the Offer being executed
// api_voucher_additional_url_params: an array of right and additional_url_params for the destination instrument
//                                    right name: global apiName (e.g. io.hadron.spaceTelescope),
//                                    additional_url_params: name/value array of additional parameters to included in the additionalUrlParams for the api voucher (e.g. appId: 2)
// voucher_encrypted_by: The account and permission the voucher parameters are encrypted by (e.g. user@active)
// override_voucher_id:  if provided, attempts to create a voucher using the id (optional; defaults to next sequential id number)

// --Output is an API Voucher (an ORE Instrument saved to ORE chain)
//
// class:         'apimarket.apiVoucher'
// description:   {offerId.additionalUrlParams.apiDescription}
// security_type: {offerId.additionalUrlParams.apiSecurityType} (default to 'pass')
// issuer:        {offerId.issuer}
// start_time:    offerId.additionalUrlParams.apiStartTime  (default to current time)
// end_time:      offerId.additionalUrlParams.apiEndTime    (default to empty)
// [rights]:      an array with only a single entry
//                   name: {offerId.additionalUrlParams.apiName}
//                   description: {offerId.additionalUrlParams.apiDescription} defaults to 'Access to API {offerId.additionalUrlParams.apiName}' for
//                   additionalUrlParams: offerId.additionalUrlParams - (whats left after removing the expected params:
//                                    apiName, apiDescription, apiPaymentModel, apiPriceInCpu, apiSecurityType, apiStartTime, apiEndTime)
//                   priceInCpu: {offerId.additionalUrlParams.apiPriceInCpu}  (default to 0)

void apiregistry::licenseapi(account_name creator, account_name buyer, uint64_t offer_id, string offer_template, vector<ore_types::api_voucher_params> api_voucher_additional_url_params, string voucher_encrypted_by, uint64_t override_voucher_id)
{
    // TODO: pass the parameter_rules as additional_url_params in the offer
    require_auth(creator);

    instrument instrument_val = instrument(INSTRUMENT_CONTRACT_NAME);
    instrument::token offer;

    uint64_t start_time;
    uint64_t end_time;

    // checks if offer id is given
    if (offer_id > 0)
    {
        offer = instrument_val.find_token_by_id(offer_id);
    }
    else
    {
        offer = instrument_val.find_token_by_template(offer_template);
    }

    //id found from the instrument table
    print("found api offer: ", offer.id, " owner:", name{offer.owner}, "\n");

    auto offer_class = offer.instrument.instrument_class;
    eosio_assert(offer_class.compare("apimarket.offer.licenseApi") == 0, "must be an offer of class apimarket.offer.licenseApi");

    auto voucher_class = "apimarket.apiVoucher";

    //TODO:check if the cpu payment has been made

    auto issuer = offer.instrument.issuer;
    auto offer_rights = offer.instrument.rights;
    auto parameter_rules = offer.instrument.parameter_rules;

    vector<ore_types::right> new_rights;

    string api_voucher_license_price_in_cpu = offer_rights[0].additional_url_params[0].params[0].value;
    uint64_t api_voucher_lifetime_in_seconds = uint64_t(stoi(offer_rights[0].additional_url_params[0].params[1].value));
    uint64_t api_voucher_start_date = uint64_t(stoi(offer_rights[0].additional_url_params[0].params[2].value));
    uint64_t api_voucher_end_date = uint64_t(stoi(offer_rights[0].additional_url_params[0].params[3].value));
    string api_voucher_security_type = offer_rights[0].additional_url_params[0].params[4].value;
    uint8_t api_voucher_mutability = uint8_t(stoi(offer_rights[0].additional_url_params[0].params[5].value));
    uint8_t api_voucher_valid_forever = uint8_t(stoi(offer_rights[0].additional_url_params[0].params[6].value));
    offer_rights[0].additional_url_params.erase(offer_rights[0].additional_url_params.begin());

    string api_name;
    string api_description;
    string price_in_cpu;

    for (int i = 0; i < offer_rights.size(); i++)
    {
        //get all the required parameters from an offer instrument
        api_name = find_arg_by_name(offer_rights[i].additional_url_params[0].params, "api_name");
        eosio_assert(api_name.compare("") == 1, "right not found");

        api_description = find_arg_by_name(offer_rights[i].additional_url_params[0].params, "api_description");
        eosio_assert(api_description.compare("") == 1, "api description not found");

        price_in_cpu = find_arg_by_name(offer_rights[i].additional_url_params[0].params, "api_price_in_cpu");
        eosio_assert(price_in_cpu.compare("") == 1, "api price in cpu not found");

        offer_rights[i].additional_url_params.erase(offer_rights[i].additional_url_params.begin());

        // create the additional_url_params object for the voucher by combining the additional_url_params from the offer and the api_voucher_additional_url_params from the input parameters
        if (api_voucher_additional_url_params.size() != 0)
        {
            for (int i = 0; i < api_voucher_additional_url_params.size(); i++)
            {
                if (api_name == api_voucher_additional_url_params[i].right_name)
                {
                    offer_rights[i].additional_url_params.push_back(api_voucher_additional_url_params[i].additional_url_params);
                }
            }
        }

        new_rights.push_back({api_name,
                              api_description,
                              price_in_cpu,
                              offer_rights[i].additional_url_params});
    }

    if (api_voucher_start_date == 0)
    {
        start_time = now();
    }
    else
    {
        start_time = api_voucher_start_date;
    }

    // TODO: revisit logic for the voucher end date
    if (api_voucher_end_date == 0 && api_voucher_valid_forever == 1)
    {
        end_time = 0;
    }
    else if (api_voucher_end_date == 0 && api_voucher_valid_forever == 0)
    {
        end_time = start_time + api_voucher_lifetime_in_seconds;
    }
    else
    {
        end_time = api_voucher_end_date;
    }

    // includes data such as considerations for the voucher in future
    auto data = vector<ore_types::args>{};

    // template for the new voucher
    string instrument_template = "";

    // content for the new voucher
    auto new_instrument = instrument::instrument_data{issuer, voucher_class, api_description, instrument_template, api_voucher_security_type, parameter_rules, new_rights, offer.id, data, voucher_encrypted_by, api_voucher_mutability};

    print("\nminting api voucher\n");

    // create a deferred transaction object to add instrument to the tokens table
    transaction mint_instrument{};

    // Adding createinst action to the deferred transaction to add the new instrument to the tokens table
    mint_instrument.actions.emplace_back(
        eosio::permission_level{creator, N(active)}, INSTRUMENT_CONTRACT_NAME, N(mint),
        std::make_tuple(
            creator,
            buyer,
            new_instrument,
            start_time,
            end_time,
            override_voucher_id));

    // send deferred transaction
    mint_instrument.send(MINT_DEFERRED_TRX_ID, creator);
}

EOSIO_ABI(apiregistry, (publishapi)(licenseapi))