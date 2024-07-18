# About & Help

<!-- spellchecker:words SPARQL Exportfile -->
WissKI[^1] is a system that enables users to represent data about any kind of objects using a formal ontology in an an RDF/SPARQL database.
WissKI does not fix the ontology.
The exact data model can be specified using the so-called Pathbuilder.

A typical WissKI use case is recording of objects in a scientific university collection.
Here the ontology used is the conceptual reference model developed by the international council of museums.

<!-- spellchecker:words upreme nspector athbuilders -->
The **S**upreme **I**nspector for **P**athbuilders, or SIP for short, is a tool adjacent to WissKI. 
Its' goal is to inspect and visualize pathbuilders[^2].
It was built in 2024 by Tom Wiesing to improve on the WissKI interface. 

This document is meant to provide generic information about the functionality of the SIP tool.
It assumes basic knowledge about pathbuilders and the WissKI software. 
For a more thorough introduction to to those topics please refer to the WissKI Documentation at [^3]. 

## Legal Notices

The SIP project is entirely open source and it's source code can be found on GitHub [^4]. 

**Even though you may inspect the source code to your heart's content, SIP (currently) does not have a license. This means that you may not publicly perform, create derivative works of or distribute this code (except for what is explicitly permitted by Section 5 of GitHub terms of service). In particular you are not granted a license to use this code to create visualizations of your own pathbuilders.**

This app makes use of several JavaScript libraries. Some of these require that attribution is given to their authors. You can look at these notices below.

<details>
    <summary>Legal Notices</summary>

<Legal>(the app will include legal notices here)</Legal>

</details>


## Interface Documentation

SIP runs entirely inside the browser.
The interface is split into several tabs. 
Each tab is documented below. 

**NOTE**: This documentation is still a work-in-progress.

## The Pathbuilder Tab

A pathbuilder can be loaded via the `Pathbuilder` tab. 

The inspector supports only `.xml` files at the moment. 
Clicking on the Pathbuilder box opens a dialog where the file can be selected. 
Alternatively, it can be dragged and dropped into the box to be loaded. 

<details>
    <summary>How To Create a Pathbuilder XML from within WissKI</summary>

1. Navigate to `Configuration`, `Pathbuilder` and click on `Edit` for the pathbuilder in question.
2. Scroll down to below the path list to the section `Export Templates`.
3. Click on `Create Exportfile`.
4. Click on the `Edit` button for the pathbuilder again.
5. Scroll back down to the `Export Templates` section.
6. A new link with the name of the pathbuilder and the current time should have appeared at the top of the list.
7. Download the linked file using the `.xml` ending.

</details>

When loading fails (e.g. because the file is invalid), an error message is displayed. 

After a pathbuilder has been opened, it's name is displayed in the tab instead. 
You can chose to download the opened pathbuilder, or close the file. 

## The Tree Tab

Not yet documented.

## The Bundle Graph Tab

Not yet documented.

## The Model Graph Tab

Not yet documented.

## The Namespace Map Tab

The `Namespace Map` tab allows the user to view and customize the namespace map used for displaying URIs. 
It is used for all tabs within the Inspector.
The underlying pathbuilder always contains the full URIs, and namespace maps are not persisted beyond the current session.

The initial version is generated automatically from all URIs found in the pathbuilder. 
Individual namespace URIs can be added, adjusted or deleted.

- To adjust a namespace URI, type the new URI into the URI field.
Changes are only applied once the `Apply` button is pressed; unapplied changes are discarded when navigating to another tab. 
- To delete a namespace URI, click the `Delete` button.
- To add an additional namespace, fill out the `NS` and `URI` fields, and then click the `Add` button.
Namespaces may only consist of letters, numbers, `-` and `_`s. 
While the values are not valid, it is highlighted in red.

To reset the namespace map to its' default value, click the `Reset To Default` button.

The `Export` and `Import` can be used to export and import the namespace map to a file on disk.
The Namespace Map is saved as a json file.

## The About Tab

Contains this document. 

[^1]: https://wiss-ki.eu/
[^2]: A future version of SIP may allow editing of Pathbuilders; in such a case this document will be updated.
[^3]: https://wiss-ki.eu/documentation
[^4]: not yet available