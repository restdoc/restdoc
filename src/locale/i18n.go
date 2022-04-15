package main

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io/ioutil"
	"os"
)

type M map[string]string

type Messages struct {
	XMLName xml.Name `xml:"xliff"`
	File    File     `xml:"file"`
	Version string   `xml:"version,attr"`
	xmlns   string   `xml:"xmlns,attr"`
}

type File struct {
	XMLName        xml.Name `xml:"file"`
	Body           Body     `xml:"body"`
	SourceLanguage string   `xml:"source-language,attr"`
	DataType       string   `xml:"datatype,attr"`
	Original       string   `xml:"original,attr"`
}

type Body struct {
	XMLName    xml.Name    `xml:"body"`
	TransUnits []TransUnit `xml:"trans-unit"`
}

type TransUnit struct {
	TransUnit     xml.Name       `xml:"trans-unit"`
	Id            string         `xml:"id,attr"`
	DataType      string         `xml:"datatype,attr"`
	Source        string         `xml:"source"`
	Target        string         `xml:"target"`
	Note          []string       `xml:"note"`
	ContextGroups []ContextGroup `xml:"context-group"`
}

type Note struct {
	Note     xml.Name `xml:"note"`
	Priority string   `xml:"priority"`
	From     string   `xml:"from"`
}

type ContextGroup struct {
	XMLName xml.Name  `xml:"context-group"`
	Purpose string    `xml:"purpose,attr"`
	Context []Context `xml:"context"`
}

type Context struct {
	XMLName     xml.Name `xml:"context"`
	ContextType string   `xml:"context-type,attr"`
}

func main() {

	byteValue, err := ioutil.ReadFile("messages.xlf")
	if err != nil {
		panic(err)
		return
	}

	var source Messages
	xml.Unmarshal(byteValue, &source)

	format(source)
	extract(source)
}

func extract(source Messages) []TransUnit {

	trans := []TransUnit{}
	for _, v := range source.File.Body.TransUnits {
		trans = append(trans, v)
	}
	return trans
}

func dump(language string, source Messages, translateMap map[string]M) error {

	results := map[string]M{}

	for _, v := range source.File.Body.TransUnits {
		id := v.Id
		if trs, ok := translateMap[id]; ok {
			tr, ok := trs["target"]
			if !ok {
				continue
			}
			v.Target = tr
			results[id] = M{"id": id, "source": v.Source, "target": v.Target}
		} else {
			v.Target = ""
			results[id] = M{"id": id, "source": v.Source, "target": v.Target}
		}
	}

	filename := fmt.Sprintf("%s.json", language)
	f, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer f.Close()

	data, err := json.MarshalIndent(results, "", "    ")
	_, err = f.Write(data)

	return err
}

func loadLocales(content []byte) map[string]M {
	translates := map[string]M{}

	err := json.Unmarshal(content, &translates)
	if err != nil {

		return translates
	}
	return translates
}

func format(source Messages) {
	languages := []string{"zh-hans", "en-us", "en", "ja"}

	for _, language := range languages {

		translatedFile := fmt.Sprintf("%s.json", language)
		translatedContent, err := ioutil.ReadFile(translatedFile)
		if err != nil {
			continue
		}

		translates := loadLocales(translatedContent)
		dump(language, source, translates)

		trans := []TransUnit{}
		for _, v := range source.File.Body.TransUnits {
			id := v.Id
			if trs, ok := translates[id]; ok {
				tr, ok := trs["target"]
				if ok {
					v.Target = tr
					trans = append(trans, v)
				} else {
					v.Target = ""
					trans = append(trans, v)
				}
			} else {
				v.Target = ""
				trans = append(trans, v)
			}
		}

		source.File.Body.TransUnits = trans

		target, err := xml.MarshalIndent(source, "", "  ")
		if err != nil {
			fmt.Println(err)
			return
		}
		target = []byte(xml.Header + string(target))
		//write to file
		filename := fmt.Sprintf("messages.%s.xlf", language)
		f, err := os.Create(filename)
		if err != nil {
			fmt.Println(err)
			return
		}
		defer f.Close()

		_, err = f.Write(target)
		if err != nil {
			fmt.Println(err)
		}

	}
}
