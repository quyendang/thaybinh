from app.services.word_types import short_type


def test_short_type_matches_fasteng_rules():
    assert short_type("noun") == "n"
    assert short_type("noun, verb") == "n | v"
    assert short_type("Adjective") == "adj"
    assert short_type("prepositional phrase") == "pre phr"
    assert short_type("phrasal verb") == "phr v"
    assert short_type("modal verb") == "modal v"
    assert short_type("causative verb") == "caus v"
    assert short_type("idiom") == "idiom"
    assert short_type(None) == ""
    assert short_type("  ") == ""
