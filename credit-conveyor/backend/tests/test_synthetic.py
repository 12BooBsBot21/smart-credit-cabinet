from app.domain.requisites import is_valid_inn, is_valid_ogrn
from app.synthetic.personas import PERSONAS


def test_persona_requisites_have_valid_checksums():
    for persona in PERSONAS:
        assert is_valid_inn(persona.company["inn"]), persona.login
        assert is_valid_ogrn(persona.company["ogrn"]), persona.login


def test_ogrn_matches_registration_year_and_legal_form():
    for persona in PERSONAS:
        company = persona.company
        ogrn = company["ogrn"]
        assert ogrn[1:3] == str(company["registered_at"].year)[2:], persona.login
        assert len(ogrn) == (15 if company["legal_form"] == "IP" else 13), persona.login


def test_invalid_requisites_are_rejected():
    assert not is_valid_inn("7812045739")
    assert not is_valid_ogrn("1217847005123")
