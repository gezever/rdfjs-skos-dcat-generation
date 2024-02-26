import {readFileSync} from "fs";
import {RoxiReasoner} from "roxi-js";


async function n3_reasoning() {
    console.log("n3 reasoning");
    let rdf = readFileSync('data.ttl', 'utf8');
    const rules = readFileSync('rules.n3', 'utf8');
    const reasoner = RoxiReasoner.new();
    reasoner.add_abox(rdf);
    reasoner.add_rules(rules);
    reasoner.materialize();
    console.log(reasoner.get_abox_dump());
}
n3_reasoning()