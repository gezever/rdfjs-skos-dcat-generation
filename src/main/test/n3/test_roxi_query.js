import {RoxiReasoner} from "roxi-js";
const reasoner = RoxiReasoner.new();

reasoner.add_abox("<http://example2.com/a> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.test.be/test#SubClass> .");
reasoner.add_rules("@prefix test: <http://www.test.be/test#>.\n @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.\n {?s rdf:type test:SubClass. }=>{?s rdf:type test:SuperType.}");
reasoner.materialize();
let array = reasoner.query('prefix test: <http://www.test.be/test#> prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> select * where {?s rdf:type test:SubClass.}');
console.log(reasoner.get_abox_dump());