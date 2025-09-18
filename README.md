# rdfjs-skos-dcat-generation


## Streamlining Data Governance: A Solution for Managing Reference Data
**Van Haute Geert**

**Poster :**
![Poster](src/documentation/poster-ufora-lod-2023.pdf)

## Context
Software development is typically the outcome of a larger change process aimed at optimizing business operations. This process typically commences with an analysis of existing business processes. During these business analyses, conducted by business or functional analysts through interviews with relevant personnel, the processes and their associated elements are identified and documented in explanatory lists known as business terms. Currently, these business analyses culminate in the creation of distributed, non-machine-readable documents such as Word files or wiki pages.
When developing a business application, the reference data present in the business terms lists needs to be converted into machine-readable formats. This involves transforming the data into enumerated values within the application's java code or storing them in relational databases as tables.
In the context of supporting business processes, the business applications gather substantial amounts of relevant data. In the case of the Flemish government's Environment Department, this often involves environmental data, which must adhere to the Aarhus Convention's principles on actively sharing information. To facilitate data integration and disclosure, transformation processes are employed to convert data from various business applications into Resource Description Framework (RDF) format. As part of this transformation, the enumerated values and reference data tables are converted into SKOS (Simple Knowledge Organization System) concepts.
## Need

To establish a governance framework for reference data, the following actions are necessary:

1. Harmonizing Business Terms: It is crucial to achieve consensus among all stakeholders involved in the project, as well as compliance with relevant laws, regarding the definition and interpretation of business terms. This process may vary in complexity based on the number of individuals and domains affected.

2. Working Groups for List Management: Establishing working groups composed of subject matter experts is essential for the effective management of these lists. This collaborative and transparent approach ensures that versions of the lists are discrete, meaningful, and continuously reviewed.

3. Adherence to Machine-Readable and Web Standards: By adopting a machine-readable format in alignment with web standards, the versioned lists are easily accessible and well-suited for automation. This enables business leaders to consistently implement changes across all levels of the organization, ensuring uniformity and accuracy in data management.

The reusability of machine-readable lists in both business applications and web publication is a key advantage of implementing a governance framework for reference data.

In terms of business applications, having machine-readable lists allows for seamless integration with various systems and applications. These lists can serve as a consistent and reliable source of reference data that can be readily utilized by different business processes and applications within an organization. This promotes data consistency, accuracy, and efficiency in operations, as the same authoritative data is used across systems.

Furthermore, the machine-readable format enables easy sharing and consumption of reference data through web publication. The lists can be published on an accessible web platform, complying with web standards, making it convenient for users to refer to and utilize the data for their own purposes. This promotes interoperability and collaboration, as multiple stakeholders can leverage the reference data in their own systems and applications, leading to improved decision-making and overall organizational efficiency.

In summary, the reusability of machine-readable lists in business applications and web publication enhances data consistency, fosters collaboration, and promotes efficiency by ensuring the consistent use of authoritative reference data across various systems and enabling easy sharing and consumption of the data through web platforms.

## Task
• Implementing a set of user-friendly tools for managing reference data, accommodating individuals with limited technical background.

• Establishing a transparent system for managing different versions of reference data.

• Ensuring machine-readable distributions, versioned code dependencies, and adherence to web standards.

• Conducting training sessions to educate business analysts and business architects on producing the desired outcomes from their analysis.

• Forming governance work groups to oversee and guide the data governance processes.

## Solution

The proposed solution for this project involves utilizing GitHub version control software to manage the reference data. The source of the reference data is a CSV file, which undergoes transformation, using javascript, into multiple RDF distributions. Additionally, a JAR dependency is created, containing these distributions. To ensure proper documentation, metadata for the versioned distributions is generated in DCAT (Data Catalog Vocabulary) format, which is added to the version control system and also packaged as a jar dependency.

Once there is consensus on the content of the reference data, all these components are released as a version in a Maven build on the Bamboo build server. This allows for controlled and structured deployment of the reference data in a standardized manner. The use of GitHub version control, along with Maven and Bamboo, ensures traceability, collaboration, and reproducibility in managing the reference data throughout its lifecycle.
## Conclusion/perspective
In conclusion, the proposed system is suitable and user-friendly for managing simple lists and controlled vocabularies with limited interdependencies and a small number of concepts. It efficiently handles straightforward reference data requirements. However, for more complex lists, particularly those categorized as master data, such as chemical substance lists that necessitate a step-by-step protocol, it may be beneficial to develop specific business applications to assist in the governance process. These applications can provide dedicated functionalities and features tailored to the unique complexities of managing and governing intricate reference data, enhancing efficiency and accuracy in the governance process.
